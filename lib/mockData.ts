import { Deal } from './types';

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

  // Guild
  { id: 'gu1', company: 'MindPath Foundation', owner: 'Priya Nair', value: 15000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'guild', probability: 1   },
  { id: 'gu2', company: 'Nexus Community',     owner: 'Priya Nair', value: 9500,  stage: 'Proposal', forecastCategory: 'Best Case', closeDate: '2026-05-18', area: 'guild', probability: 0.5 },
  { id: 'gu3', company: 'OpenLearn Alliance',  owner: 'Raj Patel',  value: 22000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'guild', probability: 1   },
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

  // Guild
  { id: 'gu1', company: 'MindPath Foundation', owner: 'Priya Nair', value: 15000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-01', area: 'guild', probability: 1   },
  { id: 'gu2', company: 'Nexus Community',     owner: 'Priya Nair', value: 9500,  stage: 'Proposal', forecastCategory: 'Pipeline',  closeDate: '2026-05-18', area: 'guild', probability: 0.5 },
  { id: 'gu3', company: 'OpenLearn Alliance',  owner: 'Raj Patel',  value: 22000, stage: 'Active',   forecastCategory: 'Commit',    closeDate: '2026-05-02', area: 'guild', probability: 1   },
];
