import { Deal, MastersheetForecast, GuildFunnelData, GuildFunnelPeriod } from './types';

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

// Official monthly plan from [Import Range] Month's M tab — used for "vs Forecast" comparison on Overview
export const monthsMForecasts: MastersheetForecast[] = [
  {
    area: 'new-business',
    months: {
      '2026-01': 179922, '2026-02': 244540, '2026-03': 545488,
      '2026-04': 430395, '2026-05': 294350, '2026-06': 370000,
      '2026-07': 556000, '2026-08': 556000, '2026-09': 556000,
      '2026-10': 583000, '2026-11': 583000, '2026-12': 583000,
    },
  },
  {
    area: 'customer-success',
    months: {
      '2026-01': 481046, '2026-02': 699972, '2026-03':  975218,
      '2026-04': 460411, '2026-05': 498195, '2026-06': 1043808,
      '2026-07': 304326, '2026-08': 522469, '2026-09':  833810,
      '2026-10': 549643, '2026-11': 828146, '2026-12': 1422835,
    },
  },
  {
    area: 'resellers',
    months: {
      '2026-01':  7468, '2026-02':    86, '2026-03':    513,
      '2026-04': 51440, '2026-05': 10000, '2026-06': 131260,
      '2026-07': 68728, '2026-08': 94440, '2026-09': 155000,
      '2026-10': 73944, '2026-11': 68996, '2026-12': 208700,
    },
  },
  {
    area: 'guild-fll',
    months: {
      '2026-01': 346316, '2026-02': 495443, '2026-03': 425264,
      '2026-04': 427732, '2026-05': 470376, '2026-06': 514312,
      '2026-07': 533696, '2026-08': 533696, '2026-09': 533696,
      '2026-10': 559541, '2026-11': 559541, '2026-12': 559541,
    },
  },
  {
    area: 'guild-ell',
    months: {
      '2026-01':  28114, '2026-02':  67157, '2026-03':  59641,
      '2026-04':  49105, '2026-05':  86580, '2026-06': 165407,
      '2026-07': 117594, '2026-08': 122763, '2026-09': 164115,
      '2026-10': 174453, '2026-11': 174453, '2026-12': 174453,
    },
  },
  {
    area: 'partnerships',
    months: {
      '2026-01': 209795, '2026-02': 209356, '2026-03': 235965,
      '2026-04': 315207, '2026-05': 218360, '2026-06': 240865,
      '2026-07': 249823, '2026-08': 249345, '2026-09': 268728,
      '2026-10': 254183, '2026-11': 266424, '2026-12': 293300,
    },
  },
];

// ─── Guild FLL & ELL funnel mock data ────────────────────────────────────────
// Mirrors the new "Guild" tab of the Google Sheet: Leads → EVs → Bookings,
// split into New / Recurring / Total. Replace by wiring the sheet through
// fetchDashboardData in lib/sheets.ts.

function gp(
  year: number, month: number, forecast: boolean,
  newL: number, recL: number,
  newE: number, recE: number,
  newB: number, recB: number,
  newConv: number, recConv: number, totalConv: number,
  bookUSD: number,
): GuildFunnelPeriod {
  const label = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    label,
    granularity: 'month',
    year, month,
    isForecast: forecast,
    metrics: {
      newBookings:         newB,
      recurringBookings:   recB,
      totalBookings:       newB + recB,
      newConversion:       newConv / 100,
      recurringConversion: recConv / 100,
      totalConversion:     totalConv / 100,
      newEVs:              newE,
      recurringEVs:        recE,
      totalEVs:            newE + recE,
      newLeads:            newL,
      recurringLeads:      recL,
      totalLeads:          newL + recL,
      bookingsUSD:         bookUSD,
    },
  };
}

export const guildFunnelData: GuildFunnelData[] = [
  {
    area: 'guild-fll',
    periods: [
      gp(2025,  1, false, 260, 146, 210, 146, 304145, 211453, 81, 100, 88, 533644),
      gp(2025,  2, false, 342, 172, 272, 169, 391670, 243354, 80,  98, 86, 661059),
      gp(2025,  3, false, 359,  97, 292,  94, 405661, 130589, 81,  97, 85, 578614),
      gp(2025,  4, false, 332,  74, 270,  72, 360080,  96021, 81,  97, 84, 512658),
      gp(2025,  5, false, 388, 155, 310, 150, 411959, 199335, 80,  97, 85, 689540),
      gp(2025,  6, false, 379,  88, 307,  86, 399473, 111905, 81,  98, 84, 589107),
      gp(2025,  7, false, 329,  66, 263,  63, 337243,  80784, 80,  95, 83, 488674),
      gp(2025,  8, false, 289,  96, 237,  96, 304947, 123523, 82, 100, 86, 499167),
      gp(2025,  9, false, 377,  72, 304,  70, 388488,  89454, 81,  97, 83, 560626),
      gp(2025, 10, false, 347,  66, 281,  64, 361684,  82376, 81,  97, 84, 517155),
      gp(2025, 11, false, 325, 104, 265, 102, 343546, 132233, 82,  98, 86, 550133),
      gp(2025, 12, false, 254,  80, 196,  78, 250799,  99808, 77,  98, 82, 410726),
      gp(2026,  1, true,  236,  74, 197,  74, 251750,  94566, 83, 100, 87, 406229),
      gp(2026,  2, true,  379,  71, 321,  70, 406745,  88698, 85,  99, 87, 586109),
      gp(2026,  3, true,  321,  74, 271,  57, 351361,  73903, 84,  77, 83, 491672),
      gp(2026,  4, true,  313,  77, 261,  63, 334732,  80766, 83,  82, 83, 485717.97),
      gp(2026,  5, true,  292,  76, 242,   0, 313188,      0, 83,   0, 66, 363297.64),
      gp(2026,  6, true,  361, 122, 300,  98, 387194, 126123, 83,  80, 82, 595447.77),
      gp(2026,  7, true,  385, 126, 312, 101, 402985, 130258, 81,  80, 81, 618562.35),
      gp(2026,  8, true,  385, 126, 312, 101, 402985, 130258, 81,  80, 81, 618562.35),
      gp(2026,  9, true,  385, 126, 312, 101, 402985, 130258, 81,  80, 81, 618562.35),
      gp(2026, 10, true,  407, 129, 330, 103, 426013, 133359, 81,  80, 81, 648872.13),
      gp(2026, 11, true,  407, 129, 330, 103, 426013, 133359, 81,  80, 81, 648872.13),
      gp(2026, 12, true,  407, 129, 330, 103, 426013, 133359, 81,  80, 81, 648872.13),
    ],
  },
  {
    area: 'guild-ell',
    periods: [
      gp(2025,  4, false,  91,  0,  71,  0,  94688,     0, 78,   0, 78, 106429),
      gp(2025,  5, false,  57,  0,  46,  0,  61129,     0, 81,   0, 81,  68954),
      gp(2025,  6, false,  21,  0,  19,  0,  24866,     0, 91,   0, 91,  28645.89),
      gp(2025,  7, false,  43,  0,  41,  0,  52547,     0, 95,   0, 95,  61427.52),
      gp(2025,  8, false,  33,  0,  28,  0,  36027,     0, 85,   0, 85,  41972),
      gp(2025,  9, false,  19,  0,  16,  0,  20447,     0, 84,   0, 84,  23984),
      gp(2025, 10, false,  45, 12,  34, 12,  43730, 15446, 76, 100, 81,  68916.53),
      gp(2025, 11, false,  33,  8,  30,  8,  38892, 10371, 91, 100, 93,  56962),
      gp(2025, 12, false,  15,  2,  11,  2,  14395,  1919, 75,  75, 75,  19112.25),
      gp(2026,  1, true,   27,  2,  20,  2,  25558,  2556, 74, 100, 77,  32978),
      gp(2026,  2, true,   61,  5,  48,  5,  60822,  6336, 79, 100, 80,  79447),
      gp(2026,  3, true,   48,  1,  45,  1,  58344,  1297, 94, 100, 94,  68954),
      gp(2026,  4, true,   42,  2,  36,  2,  46155,  2565, 86, 100, 86,  56953.01),
      gp(2026,  5, true,   18,  2,  14,  2,  18608,  2584, 80, 100, 82,  24583.60),
      gp(2026,  6, true,  150,  3, 125,  3, 160884,  3877, 83, 100, 83, 191122.50),
      gp(2026,  7, true,  110,  3,  88,  3, 113717,  3877, 80, 100, 81, 136409),
      gp(2026,  8, true,  110,  7,  88,  7, 113717,  9046, 80, 100, 81, 142405),
      gp(2026,  9, true,  150,  7, 120,  7, 155069,  9046, 80, 100, 81, 190373),
      gp(2026, 10, true,  160,  7, 128,  7, 165407,  9046, 80, 100, 81, 202365),
      gp(2026, 11, true,  160,  7, 128,  7, 165407,  9046, 80, 100, 81, 202365),
      gp(2026, 12, true,  160,  7, 128,  7, 165407,  9046, 80, 100, 81, 202365),
    ],
  },
];
