export type AreaKey = 'new-business' | 'customer-success' | 'resellers' | 'guild-fll' | 'guild-ell' | 'partnerships';

export interface PeriodForecast {
  closedWon:  number;
  commit:     number;
  mostLikely: number;
  bestCase:   number;
  pipeline:   number;
  omitted:    number;
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

export interface PipelineGenForecastEntry {
  period:       string;  // "2026-05" (month) or "2026-Q2" (quarter)
  events:       number;
  inboundPaid:  number;
  inboundOther: number;
  outbound:     number;
  updatedAt:    string;
}

export interface OverviewComment {
  period:    string;  // "2026-05" (month) or "2026-Q2" (quarter)
  comment:   string;
  updatedAt: string;
}

// SD forecast values from the [Import Range] Mastersheet tab, keyed by "YYYY-MM"
export interface MastersheetForecast {
  area:   string;                   // matches AreaKey
  months: Record<string, number>;   // "2026-01" → EUR amount
}

export interface PipelineGenDeal {
  id:         string;
  company:    string;
  owner:      string;
  amount:     number;     // Amount in company currency
  sourceType: string;     // raw Source Type value
  createDate: string;     // YYYY-MM-DD
}
export type ForecastCategory = 'Commit' | 'Most Likely' | 'Best Case' | 'Pipeline' | 'Omitted';

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
  { key: 'guild-fll',        label: 'Guild FLL',        accentColor: '#F59E0B', bgLight: 'bg-amber-50',   borderColor: 'border-amber-200'   },
  { key: 'guild-ell',        label: 'Guild ELL',        accentColor: '#F97316', bgLight: 'bg-orange-50',  borderColor: 'border-orange-200'  },
  { key: 'partnerships',    label: 'Partnerships',    accentColor: '#EC4899', bgLight: 'bg-pink-50',    borderColor: 'border-pink-200'    },
];

export const SUB_TABS: { key: SubTabKey; label: string }[] = [
  { key: 'results',  label: 'Results'              },
  { key: 'forecast', label: 'SD Forecast'          },
  { key: 'wow',      label: 'WoW Changes'          },
  { key: 'prior',    label: 'Prior Period Results' },
];

// Areas that use the Guild funnel view exclusively (Leads → EVs → Bookings).
// These areas SKIP the deal-based sub-tabs and render the funnel directly.
export const GUILD_FUNNEL_AREAS: AreaKey[] = ['guild-fll', 'guild-ell'];

export interface GuildFunnelMetrics {
  newBookings:         number;  // EUR
  recurringBookings:   number;
  totalBookings:       number;
  newConversion:       number;  // 0..1
  recurringConversion: number;
  totalConversion:     number;
  newEVs:              number;
  recurringEVs:        number;
  totalEVs:            number;
  newLeads:            number;
  recurringLeads:      number;
  totalLeads:          number;
  bookingsUSD:         number;
}

export interface GuildFunnelPeriod {
  key:         string;                       // "2026-05"
  label:       string;                       // "May 2026"
  granularity: 'month';                      // mock stores monthly; quarter/year aggregated in view
  year:        number;
  month:       number;
  isForecast:  boolean;
  metrics:     GuildFunnelMetrics;
}

export interface GuildFunnelData {
  area:    'guild-fll' | 'guild-ell';
  periods: GuildFunnelPeriod[];
}
