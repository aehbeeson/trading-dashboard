import { Deal } from './types';

// Placeholder data — replace by wiring up Google Sheets in lib/sheets.ts
export const thisWeekDeals: Deal[] = [
  // New Business
  { id: 'nb1', company: 'Acme Global Ltd',      owner: 'James Carter', value: 48000, stage: 'Closed Won',      forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'new-business' },
  { id: 'nb2', company: 'BrightPath Education', owner: 'James Carter', value: 32000, stage: 'Proposal Sent',   forecastCategory: 'Best Case', closeDate: '2026-05-15', area: 'new-business' },
  { id: 'nb3', company: 'CoreTech Solutions',   owner: 'Emma White',   value: 24000, stage: 'Negotiation',     forecastCategory: 'Commit',    closeDate: '2026-05-10', area: 'new-business' },
  { id: 'nb4', company: 'Deluxe Finance Group', owner: 'Emma White',   value: 18000, stage: 'Discovery',       forecastCategory: 'Pipeline',  closeDate: '2026-06-01', area: 'new-business' },
  { id: 'nb5', company: 'Elevate HR',           owner: 'Mark Thompson',value: 55000, stage: 'Closed Won',      forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'new-business' },

  // Customer Success
  { id: 'cs1', company: 'FutureTech Inc',    owner: 'Lisa Park',  value: 72000, stage: 'Renewal Confirmed', forecastCategory: 'Commit',    closeDate: '2026-05-05', area: 'customer-success' },
  { id: 'cs2', company: 'GlobalServe Ltd',   owner: 'Lisa Park',  value: 38000, stage: 'Upsell Proposed',   forecastCategory: 'Best Case', closeDate: '2026-05-20', area: 'customer-success' },
  { id: 'cs3', company: 'HorizonBank',       owner: 'David Osei', value: 95000, stage: 'Renewal Confirmed', forecastCategory: 'Commit',    closeDate: '2026-05-08', area: 'customer-success' },
  { id: 'cs4', company: 'Innovate Labs',     owner: 'David Osei', value: 28000, stage: 'At Risk',           forecastCategory: 'Best Case', closeDate: '2026-05-25', area: 'customer-success' },

  // Resellers
  { id: 're1', company: 'JetStream Partners', owner: 'Cara Bloom', value: 42000, stage: 'Partner Confirmed', forecastCategory: 'Commit',   closeDate: '2026-05-03', area: 'resellers' },
  { id: 're2', company: 'KineticEd Group',   owner: 'Cara Bloom', value: 19000, stage: 'Proposal',          forecastCategory: 'Pipeline', closeDate: '2026-05-28', area: 'resellers' },
  { id: 're3', company: 'LearnBridge EMEA',  owner: 'Tom Archer', value: 61000, stage: 'Closed Won',        forecastCategory: 'Commit',   closeDate: '2026-04-30', area: 'resellers' },

  // Guild
  { id: 'gu1', company: 'MindPath Foundation', owner: 'Priya Nair', value: 15000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'guild' },
  { id: 'gu2', company: 'Nexus Community',     owner: 'Priya Nair', value: 9500,  stage: 'Proposal', forecastCategory: 'Best Case', closeDate: '2026-05-18', area: 'guild' },
  { id: 'gu3', company: 'OpenLearn Alliance',  owner: 'Raj Patel',  value: 22000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'guild' },
];

export const lastWeekDeals: Deal[] = [
  // New Business — Acme moved stage, Elevate HR is brand new (not here), BrightPath moved forecast
  { id: 'nb1', company: 'Acme Global Ltd',      owner: 'James Carter', value: 48000, stage: 'Negotiation',   forecastCategory: 'Best Case', closeDate: '2026-05-02', area: 'new-business' },
  { id: 'nb2', company: 'BrightPath Education', owner: 'James Carter', value: 32000, stage: 'Proposal Sent', forecastCategory: 'Pipeline',  closeDate: '2026-05-15', area: 'new-business' },
  { id: 'nb3', company: 'CoreTech Solutions',   owner: 'Emma White',   value: 24000, stage: 'Proposal Sent', forecastCategory: 'Best Case', closeDate: '2026-05-10', area: 'new-business' },
  { id: 'nb4', company: 'Deluxe Finance Group', owner: 'Emma White',   value: 18000, stage: 'Discovery',     forecastCategory: 'Pipeline',  closeDate: '2026-06-01', area: 'new-business' },

  // Customer Success — HorizonBank moved stage, Innovate lost value + moved stage, Pebble removed this week
  { id: 'cs1', company: 'FutureTech Inc',  owner: 'Lisa Park',  value: 72000, stage: 'Renewal In Progress', forecastCategory: 'Best Case', closeDate: '2026-05-05', area: 'customer-success' },
  { id: 'cs2', company: 'GlobalServe Ltd', owner: 'Lisa Park',  value: 38000, stage: 'Upsell Proposed',     forecastCategory: 'Pipeline',  closeDate: '2026-05-20', area: 'customer-success' },
  { id: 'cs3', company: 'HorizonBank',     owner: 'David Osei', value: 95000, stage: 'Renewal In Progress', forecastCategory: 'Best Case', closeDate: '2026-05-08', area: 'customer-success' },
  { id: 'cs4', company: 'Innovate Labs',   owner: 'David Osei', value: 35000, stage: 'Healthy',             forecastCategory: 'Commit',    closeDate: '2026-05-25', area: 'customer-success' },
  { id: 'cs5', company: 'Pebble Systems', owner: 'David Osei', value: 12000, stage: 'Renewal In Progress', forecastCategory: 'Best Case', closeDate: '2026-05-01', area: 'customer-success' },

  // Resellers — LearnBridge increased value + moved stage, JetStream moved forecast
  { id: 're1', company: 'JetStream Partners', owner: 'Cara Bloom', value: 42000, stage: 'Proposal',    forecastCategory: 'Best Case', closeDate: '2026-05-03', area: 'resellers' },
  { id: 're2', company: 'KineticEd Group',   owner: 'Cara Bloom', value: 19000, stage: 'Proposal',    forecastCategory: 'Pipeline',  closeDate: '2026-05-28', area: 'resellers' },
  { id: 're3', company: 'LearnBridge EMEA',  owner: 'Tom Archer', value: 56000, stage: 'Negotiation', forecastCategory: 'Best Case', closeDate: '2026-04-30', area: 'resellers' },

  // Guild — unchanged
  { id: 'gu1', company: 'MindPath Foundation', owner: 'Priya Nair', value: 15000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'guild' },
  { id: 'gu2', company: 'Nexus Community',     owner: 'Priya Nair', value: 9500,  stage: 'Proposal', forecastCategory: 'Pipeline',  closeDate: '2026-05-18', area: 'guild' },
  { id: 'gu3', company: 'OpenLearn Alliance',  owner: 'Raj Patel',  value: 22000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'guild' },
];
