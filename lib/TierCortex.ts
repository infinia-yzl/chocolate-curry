import Tier, {DEFAULT_TIER_TEMPLATE} from "@/models/Tier";
import Item from "@/models/Item";
import imagesetConfig from "@/imageset.config.json";
import ImageSetConfig from "@/models/ImageSet";
import {ItemSet} from "@/models/ItemSet";
import LZString from 'lz-string';

const CUSTOM_ITEMS_KEY = 'customItems';
const typedImageSetConfig = imagesetConfig as ImageSetConfig;

interface SimplifiedTier {
  i: string; // id
  n: string; // name
  t: SimplifiedItem[]; // items
}

interface SimplifiedItem {
  i: string; // id
  c: string; // content
}

interface StoredCustomItem {
  i: string; // id
  c: string; // content
  d: string; // imageData
}

export interface PackageItemLookup {
  [key: string]: Item;
}

const OG_TIER_GRADIENTS = [
  'linear-gradient(to right, #d21203, #c40a01)',
  'linear-gradient(to right, #ee1e1e, #f84a44)',
  'linear-gradient(to right, #dca414, #dc991d)',
  'linear-gradient(to right, #c98b17, #e8910f)',
  'linear-gradient(to right, #7ad21f, #1aea1d)',
  'linear-gradient(to right, #72b231, #0cd30e)',
  'linear-gradient(to right, #4d7e15, #01b004)',
];

export class TierCortex {
  // this class isn't concerned about managing UI states, so tiers are managed externally
  private readonly packageItemLookup: PackageItemLookup;
  private customItemsMap: Map<string, StoredCustomItem>;
  private readonly isServer: boolean;
  private baseUrl: string;


  constructor() {
    this.isServer = typeof window === 'undefined';
    this.baseUrl = this.isServer ? process.env.NEXT_PUBLIC_BASE_URL || '' : window.location.origin;
    this.packageItemLookup = this.initializePackageItemLookup();
    this.customItemsMap = new Map<string, StoredCustomItem>();

    if (!this.isServer) {
      this.initializeCustomItemsMap();
    }
  }

  public static encodeTierStateForURL(tiers: Tier[]): string {
    const simplifiedTiers: SimplifiedTier[] = tiers.map(tier => ({
      i: tier.id,
      n: tier.name,
      t: tier.items.map(item => ({
        i: item.id,
        c: item.content
      }))
    }));
    const jsonString = JSON.stringify(simplifiedTiers);
    return LZString.compressToEncodedURIComponent(jsonString);
  }

  public getOgTierGradient(index: number, tiersLength: number): string {
    if (index === tiersLength - 1) return 'linear-gradient(to right, #f0f0f0, #f0f0f0)';
    return OG_TIER_GRADIENTS[index % OG_TIER_GRADIENTS.length];
  }

  public decodeTierStateFromURL(encodedState: string): Tier[] | null {
    try {
      const jsonString = LZString.decompressFromEncodedURIComponent(encodedState);
      if (!jsonString) throw new Error('Failed to decompress state');

      const simplifiedTiers = JSON.parse(jsonString) as SimplifiedTier[];

      return simplifiedTiers.map(simplifiedTier => ({
        id: simplifiedTier.i,
        name: simplifiedTier.n,
        items: simplifiedTier.t.map(item => this.resolveItem(item.i, item.c))
      }));
    } catch (error) {
      console.error('Failed to decode tier state from URL:', error);
      return null;
    }
  }

  public addCustomItems(items: Item[]): void {
    if (this.isServer) return;

    const newItems = items.map(item => ({
      i: item.id,
      c: item.content,
      d: item.imageUrl ?? ''
    }));

    newItems.forEach(item => this.customItemsMap.set(item.i, item));

    const allItems = Array.from(this.customItemsMap.values());
    localStorage.setItem(CUSTOM_ITEMS_KEY, JSON.stringify(allItems));
  }

  public getInitialTiers(initialState: string | undefined, initialItemSet: ItemSet | undefined): Tier[] {
    if (initialState) {
      const decodedState = this.decodeTierStateFromURL(initialState);
      if (decodedState) return decodedState;
    }

    if (initialItemSet) {
      const initialTiers = [...DEFAULT_TIER_TEMPLATE];
      const lastTierIndex = initialTiers.length - 1;

      initialTiers[lastTierIndex].items = initialItemSet.images.map((filename) => {
        const itemId = `${initialItemSet.packageName}-${filename}`;
        return this.packageItemLookup[itemId] || this.createPlaceholderItem(itemId, filename);
      });
      return initialTiers;
    }

    return DEFAULT_TIER_TEMPLATE;
  }

  public getOgSafeImageUrl(url: string): string {
    // Convert WebP to PNG
    if (url.toLowerCase().endsWith('.webp')) {
      url = url.substring(0, url.length - 5) + '.png';
    }

    // Make URL absolute if it's not already
    if (!url.startsWith('http')) {
      url = new URL(url, this.baseUrl).toString();
    }

    return url;
  }

  public getOgSafeItem(item: Item): Item {
    return {
      ...item,
      imageUrl: this.getOgSafeImageUrl(item.imageUrl ?? '')
    };
  }

  private initializePackageItemLookup(): PackageItemLookup {
    let packageItemLookup: PackageItemLookup = {};
    for (const [packageName, packageData] of Object.entries(typedImageSetConfig.packages)) {
      for (const image of packageData.images) {
        const id = `${packageName}-${image.filename}`;
        packageItemLookup[id] = {
          id,
          content: image.label || image.filename.split('.')[0],
          imageUrl: `/images/${packageName}/${image.filename}`,
        };
      }
    }
    return packageItemLookup;
  }

  private initializeCustomItemsMap(): void {
    if (this.customItemsMap.size === 0) {
      const customItems = this.loadCustomItemsFromLocalStorage();
      customItems.forEach(item => this.customItemsMap.set(item.i, item));
    }
  }

  private resolveItem(itemId: string, content: string): Item {
    const packageItem = this.packageItemLookup[itemId];
    if (packageItem) return packageItem;

    if (!this.isServer) {
      const customItem = this.customItemsMap.get(itemId);
      if (customItem) {
        return {
          id: customItem.i,
          content: content,
          imageUrl: customItem.d,
        };
      }
    }

    return this.createPlaceholderItem(itemId, content);
  }

  private createPlaceholderItem(itemId: string, content: string): Item {
    return {
      id: itemId,
      content,
      imageUrl: this.getAbsoluteUrl('/placeholder-image.jpg'),
    };
  }

  private loadCustomItemsFromLocalStorage(): StoredCustomItem[] {
    if (this.isServer) return [];

    const storedItems = localStorage.getItem(CUSTOM_ITEMS_KEY);
    if (!storedItems) return [];
    try {
      return JSON.parse(storedItems);
    } catch (error) {
      console.error('Failed to parse stored custom items:', error);
      return [];
    }
  }

  private getAbsoluteUrl(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }
}

export default TierCortex;
