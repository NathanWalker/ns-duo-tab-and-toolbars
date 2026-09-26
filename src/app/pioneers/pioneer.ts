export interface Pioneer {
  id: number;
  name: string;
  nationality: string;
  born: number;
  died?: number;
  field: string;
  /** SF Symbol standing in for a portrait. */
  symbol: string;
  tint: string;
  summary: string;
  achievements: string[];
  wikipedia: string;
}

export type PioneerSort = 'curated' | 'name' | 'era';
