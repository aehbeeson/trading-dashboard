export type AreaKey = 'new-business' | 'customer-success' | 'resellers' | 'guild';

export interface PeriodForecast {
  closedWon: number;
  commit:    number;
  bestCase:  number;
  pipeline:  number;
  omitted:   number;
}

export interface SDForecastEntry {
  area:       string;
  month:      PeriodForecast;
  quarter:    PeriodForecast;
  mainDeals:  string;
  otherDeals: string;
  updatedAt:  string;
}
export type SubTabKey = 'results' | 'forecast' | 'wow' | 'prior' | 'pipeline-gen';

export interface PipelineGenDeal {
  id:         string;
  company:    string;
  owner:      string;
  amount:     number;     // Amount in company currency
  sourceType: string;     // raw Source Type value
  createDate: string;     // YYYY-MM-DD
}
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
  probability: number; // 0–1, where 1 = Closed Won, 0 = Closed Lost
  closeWeekNo?: string; // e.g. "5 2024"
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
  { key: 'prior',    label: 'Prior Period Results' },
];
