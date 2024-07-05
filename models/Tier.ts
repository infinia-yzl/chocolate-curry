import Item from "@/models/Item";

export type LabelPosition = 'top' | 'left' | 'right';

export default interface Tier {
  id: string;
  name: string;
  items: Item[];
  labelPosition?: LabelPosition;
  placeholder?: string;
}

export type TierTemplate = Record<string, Tier[]>;

export const tierTemplates: TierTemplate = {
  '3rows': [
    {id: 'tier-s', name: 'S', items: [], labelPosition: 'left', placeholder: 'S'},
    {id: 'tier-a', name: 'A', items: [], labelPosition: 'left', placeholder: 'A'},
    {id: 'tier-b', name: 'B', items: [], labelPosition: 'left', placeholder: 'B'},
  ],
  '5rows': [
    {id: 'tier-s', name: 'S', items: [], labelPosition: 'left', placeholder: 'S'},
    {id: 'tier-a', name: 'A', items: [], labelPosition: 'left', placeholder: 'A'},
    {id: 'tier-b', name: 'B', items: [], labelPosition: 'left', placeholder: 'B'},
    {id: 'tier-c', name: 'C', items: [], labelPosition: 'left', placeholder: 'C'},
    {id: 'tier-f', name: 'F', items: [], labelPosition: 'left', placeholder: 'F'},
  ],
  '7rows': [
    {id: 'tier-ss', name: 'SS', items: [], labelPosition: 'left', placeholder: 'SS'},
    {id: 'tier-s', name: 'S', items: [], labelPosition: 'left', placeholder: 'S'},
    {id: 'tier-a', name: 'A', items: [], labelPosition: 'left', placeholder: 'A'},
    {id: 'tier-b', name: 'B', items: [], labelPosition: 'left', placeholder: 'B'},
    {id: 'tier-c', name: 'C', items: [], labelPosition: 'left', placeholder: 'C'},
    {id: 'tier-d', name: 'D', items: [], labelPosition: 'left', placeholder: 'D'},
    {id: 'tier-f', name: 'F', items: [], labelPosition: 'left', placeholder: 'F'},
  ],
};

export const DEFAULT_TIER_TEMPLATE = tierTemplates['5rows'];
