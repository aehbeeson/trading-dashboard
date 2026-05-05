import { Deal, MastersheetForecast } from './types';

// Placeholder data — replace by wiring up Google Sheets in lib/sheets.ts
export const thisWeekDeals: Deal[] = [
  // New Business
  { id: 'nb1', company: 'Acme Global Ltd',      owner: 'James Carter',  value: 48000, stage: 'Closed Won',      forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'new-business',     probability: 1   },
  { id: 'nb2', company: 'BrightPath Education', owner: 'James Carter',  value: 32000, stage: 'Proposal Sent',   forecastCategory: 'Best Case', closeDate: '2026-05-15', area: 'new-business',     probability: 0.5 },
  { id: 'nb3', company: 'CoreTech Solutions',   owner: 'Emma White',    value: 24000, stage: 'Negotiation',     forecastCategory: 'Commit',    closeDate: '2026-05-10', area: 'new-business',     probability: 0.7 },
  { id: 'nb4', company: 'Deluxe Finance Group', owner: 'Emma White',    value: 18000, stage: 'Discovery',       forecastCategory: 'Pipeline',  closeDate: '2026-06-01', area: 'new-business',     probability: 0.2 },
  { id: 'nb5', company: 'Elevate HR',           owner: 'Mark Thompson', value: 55000, stage: 'Closed Won',      forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'new-business',     probability: 1   },

  // Customer Success
  { id: 'cs1', company: 'FutureTech Inc',    owner: 'Lisa Park',  value: 72000, stage: 'Renewal Confirmed', forecastCategory: 'Commit',    closeDate: '2026-05-05', area: 'customer-success', probability: 1   },
  { id: 'cs2', company: 'GlobalServe Ltd',   owner: 'Lisa Park',  value: 38000, stage: 'Upsell Proposed',   forecastCategory: 'Best Case', closeDate: '2026-05-20', area: 'customer-success', probability: 0.6 },
  { id: 'cs3', company: 'HorizonBank',       owner: 'David Osei', value: 95000, stage: 'Renewal Confirmed', forecastCategory: 'Commit',    closeDate: '2026-05-08', area: 'customer-success', probability: 1   },
  { id: 'cs4', company: 'Innovate Labs',     owner: 'David Osei', value: 28000, stage: 'At Risk',           forecastCategory: 'Best Case', closeDate: '2026-05-25', area: 'customer-success', probability: 0.3 },

  // Resellers
  { id: 're1', company: 'JetStream Partners', owner: 'Cara Bloom', value: 42000, stage: 'Partner Confirmed', forecastCategory: 'Commit',   closeDate: '2026-05-03', area: 'resellers', probability: 1   },
  { id: 're2', company: 'KineticEd Group',    owner: 'Cara Bloom', value: 19000, stage: 'Proposal',          forecastCategory: 'Pipeline', closeDate: '2026-05-28', area: 'resellers', probability: 0.4 },
  { id: 're3', company: 'LearnBridge EMEA',   owner: 'Tom Archer', value: 61000, stage: 'Closed Won',        forecastCategory: 'Commit',   closeDate: '2026-04-30', area: 'resellers', probability: 1   },

  // Guild FLL
  { id: 'gu1', company: 'MindPath Foundation', owner: 'Priya Nair', value: 15000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'guild-fll', probability: 1   },
  { id: 'gu2', company: 'Nexus Community',     owner: 'Priya Nair', value: 9500,  stage: 'Proposal', forecastCategory: 'Best Case', closeDate: '2026-05-18', area: 'guild-fll', probability: 0.5 },
  // Guild ELL
  { id: 'gu3', company: 'OpenLearn Alliance',  owner: 'Raj Patel',  value: 22000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'guild-ell', probability: 1   },
];

export const lastWeekDeals: Deal[] = [
  // New Business
  { id: 'nb1', company: 'Acme Global Ltd',      owner: 'James Carter',  value: 48000, stage: 'Negotiation',   forecastCategory: 'Best Case', closeDate: '2026-05-02', area: 'new-business',     probability: 0.7 },
  { id: 'nb2', company: 'BrightPath Education', owner: 'James Carter',  value: 32000, stage: 'Proposal Sent', forecastCategory: 'Pipeline',  closeDate: '2026-05-15', area: 'new-business',     probability: 0.5 },
  { id: 'nb3', company: 'CoreTech Solutions',   owner: 'Emma White',    value: 24000, stage: 'Proposal Sent', forecastCategory: 'Best Case', closeDate: '2026-05-10', area: 'new-business',     probability: 0.5 },
  { id: 'nb4', company: 'Deluxe Finance Group', owner: 'Emma White',    value: 18000, stage: 'Discovery',     forecastCategory: 'Pipeline',  closeDate: '2026-06-01', area: 'new-business',     probability: 0.2 },

  // Customer Success
  { id: 'cs1', company: 'FutureTech Inc',  owner: 'Lisa Park',  value: 72000, stage: 'Renewal In Progress', forecastCategory: 'Best Case', closeDate: '2026-05-05', area: 'customer-success', probability: 0.8 },
  { id: 'cs2', company: 'GlobalServe Ltd', owner: 'Lisa Park',  value: 38000, stage: 'Upsell Proposed',     forecastCategory: 'Pipeline',  closeDate: '2026-05-20', area: 'customer-success', probability: 0.6 },
  { id: 'cs3', company: 'HorizonBank',     owner: 'David Osei', value: 95000, stage: 'Renewal In Progress', forecastCategory: 'Best Case', closeDate: '2026-05-08', area: 'customer-success', probability: 0.8 },
  { id: 'cs4', company: 'Innovate Labs',   owner: 'David Osei', value: 35000, stage: 'Healthy',             forecastCategory: 'Commit',    closeDate: '2026-05-25', area: 'customer-success', probability: 0.3 },
  { id: 'cs5', company: 'Pebble Systems', owner: 'David Osei',  value: 12000, stage: 'Renewal In Progress', forecastCategory: 'Best Case', closeDate: '2026-05-01', area: 'customer-success', probability: 0.5 },

  // Resellers
  { id: 're1', company: 'JetStream Partners', owner: 'Cara Bloom', value: 42000, stage: 'Proposal',    forecastCategory: 'Best Case', closeDate: '2026-05-03', area: 'resellers', probability: 0.6 },
  { id: 're2', company: 'KineticEd Group',    owner: 'Cara Bloom', value: 19000, stage: 'Proposal',    forecastCategory: 'Pipeline',  closeDate: '2026-05-28', area: 'resellers', probability: 0.4 },
  { id: 're3', company: 'LearnBridge EMEA',   owner: 'Tom Archer', value: 56000, stage: 'Negotiation', forecastCategory: 'Best Case', closeDate: '2026-04-30', area: 'resellers', probability: 0.7 },

  // Guild FLL
  { id: 'gu1', company: 'MindPath Foundation', owner: 'Priya Nair', value: 15000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'guild-fll', probability: 1   },
  { id: 'gu2', company: 'Nexus Community',     owner: 'Priya Nair', value: 9500,  stage: 'Proposal', forecastCategory: 'Pipeline',  closeDate: '2026-05-18', area: 'guild-fll', probability: 0.5 },
  // Guild ELL
  { id: 'gu3', company: 'OpenLearn Alliance',  owner: 'Raj Patel',  value: 22000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'guild-ell', probability: 1   },
];

// SD forecast values from [Import Range] Mastersheet — mirrors the "Sales Director Forecast" rows per area
export const mastersheetForecasts: MastersheetForecast[] = [
  {
    area: 'new-business',
    months: {
      '2026-01': 179922, '2026-02': 244540, '2026-03': 545488,
      '2026-04': 152940, '2026-05': 371000, '2026-06': 572000,
      '2026-07': 556000, '2026-08': 556000, '2026-09': 556000,
      '2026-10': 583000, '2026-11': 583000, '2026-12': 583000,
    },
  },
  {
    area: 'customer-success',
    months: {
      '2026-01': 481046, '2026-02': 699972, '2026-03': 975218,
      '2026-04': 271276, '2026-05': 497552, '2026-06': 940031,
      '2026-07': 304326, '2026-08': 522469, '2026-09': 833810,
      '2026-10': 549643, '2026-11': 828146, '2026-12': 1422835,
    },
  },
  {
    area: 'resellers',
    months: {
      '2026-01':  7468, '2026-02':    86, '2026-03':  513,
      '2026-04': 36403, '2026-05': 10000, '2026-06': 131260,
      '2026-07': 68728, '2026-08': 94440, '2026-09': 155000,
      '2026-10': 73944, '2026-11': 68996, '2026-12': 208700,
    },
  },
  {
    area: 'guild-fll',
    months: {
      '2026-01': 346316, '2026-02': 495443, '2026-03': 425264,
      '2026-04': 415144, '2026-05': 363611, '2026-06': 514312,
      '2026-07': 533696, '2026-08': 533696, '2026-09': 533696,
      '2026-10': 559541, '2026-11': 559541, '2026-12': 559541,
    },
  },
  {
    area: 'guild-ell',
    months: {
      '2026-01':  28114, '2026-02':  67157, '2026-03':  59641,
      '2026-04':  48678, '2026-05':  24294, '2026-06': 165407,
      '2026-07': 117594, '2026-08': 122763, '2026-09': 164115,
      '2026-10': 174453, '2026-11': 174453, '2026-12': 174453,
    },
  },
  {
    area: 'partnerships',
    months: {
      '2026-01': 209795, '2026-02': 209356, '2026-03': 235965,
      '2026-04': 341422, '2026-05': 229013, '2026-06': 228065,
      '2026-07': 249823, '2026-08': 249345, '2026-09': 268728,
      '2026-10': 254183, '2026-11': 266424, '2026-12': 293300,
    },
  },
];
