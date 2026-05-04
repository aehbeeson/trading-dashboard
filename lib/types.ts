export type AreaKey = 'new-business' | 'customer-success' | 'resellers' | 'guild';
export type SubTabKey = 'results' | 'forecast' | 'wow';
export type ForecastCategory = 'Commit' | 'Best Case' | 'Pipeline' | 'Omitted';

export interface Deal {
  id: string;
  company: string;
  owner: string;
  value: number; // ARR
  stage: string;
  forecastCategory: ForecastCategory;
  closeDate: string;
  area: AreaKey;
}

export interface AreaConfig {
  key: AreaKey;
  label: string;
  accentColor: string;
  bgLight: string;
  borderColor: string;
}

export const AREAS: AreaConfig[] = [
  { key: 'new-business',     label: 'New Business',     accentColor: '#3B82F6', bgLight: 'bg-blue-50',    borderColor: 'border-blue-200'    },
  { key: 'customer-success', label: 'Customer Success', accentColor: '#10B981', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'resellers',        label: 'Resellers',        accentColor: '#8B5CF6', bgLight: 'bg-purple-50',  borderColor: 'border-purple-200'  },
  { key: 'guild',            label: 'Guild',            accentColor: '#F59E0B', bgLight: 'bg-amber-50',   borderColor: 'border-amber-200'   },
];

export const SUB_TABS: { key: SubTabKey; label: string }[] = [
  { key: 'results',  label: 'Results'              },
  { key: 'forecast', label: 'SD Forecast'          },
  { key: 'wow',      label: 'WoW Changes'          },
];
