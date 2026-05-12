'use client';

import { useMemo, useState } from 'react';
import { GuildFunnelData, GuildFunnelMetrics, GuildFunnelPeriod } from '@/lib/types';

type ViewMode = 'table' | 'funnel';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtEUR(v: number): string {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return '€' + (v / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return '€' + Math.round(v / 1000).toLocaleString() + 'k';
  return '€' + Math.round(v).toLocaleString();
}

function fmtPct(v: number): string {
  if (v === 0) return '—';
  return Math.round(v * 100) + '%';
}

function fmtNum(v: number): string {
  if (v === 0) return '—';
  return v.toLocaleString();
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function aggregateMetrics(months: GuildFunnelPeriod[]): GuildFunnelMetrics {
  const sum = (key: keyof GuildFunnelMetrics) =>
    months.reduce((s, m) => s + (m.metrics[key] as number), 0);

  const newBookings       = sum('newBookings');
  const recurringBookings = sum('recurringBookings');
  const totalBookings     = sum('totalBookings');
  const newEVs            = sum('newEVs');
  const recurringEVs      = sum('recurringEVs');
  const totalEVs          = sum('totalEVs');
  const newLeads          = sum('newLeads');
  const recurringLeads    = sum('recurringLeads');
  const totalLeads        = sum('totalLeads');
  const bookingsUSD       = sum('bookingsUSD');

  return {
    newBookings, recurringBookings, totalBookings,
    newConversion:       newLeads       > 0 ? newEVs       / newLeads       : 0,
    recurringConversion: recurringLeads > 0 ? recurringEVs / recurringLeads : 0,
    totalConversion:     totalLeads     > 0 ? totalEVs     / totalLeads     : 0,
    newEVs, recurringEVs, totalEVs,
    newLeads, recurringLeads, totalLeads,
    bookingsUSD,
  };
}

// ─── Main view ───────────────────────────────────────────────────────────────

interface GuildFunnelViewProps {
  data:        GuildFunnelData;
  accentColor: string;
}

export default function GuildFunnelView({ data, accentColor }: GuildFunnelViewProps) {
  // Years available in the data
  const years = useMemo(() => {
    return Array.from(new Set(data.periods.map(p => p.year))).sort((a, b) => b - a);
  }, [data]);

  const today = new Date();
  const defaultYear = years.includes(today.getFullYear()) ? today.getFullYear() : years[0];

  const [year, setYear]     = useState(defaultYear);
  const [view, setView]     = useState<ViewMode>('table');

  // Months for the selected year, indexed 1..12 (sparse — may be missing some)
  const yearPeriods = useMemo(
    () => data.periods.filter(p => p.year === year).sort((a, b) => a.month - b.month),
    [data, year],
  );
  const priorYearPeriods = useMemo(
    () => data.periods.filter(p => p.year === year - 1).sort((a, b) => a.month - b.month),
    [data, year],
  );
  const isYearForecast = yearPeriods.length > 0 && yearPeriods.every(p => p.isForecast);

  return (
    <div className="space-y-5">
      {/* ── Top controls: year + view ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.14em]">Year</span>
          <div className="flex items-center bg-gray-100/80 ring-1 ring-inset ring-gray-200/70 rounded-lg px-0.5 py-0.5">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all tabular-nums ${
                  y === year
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-gray-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          {isYearForecast && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200/70 px-2 py-0.5 rounded-full">
              Forecast
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.14em]">View</span>
          <div className="flex items-center bg-gray-100/80 ring-1 ring-inset ring-gray-200/70 rounded-lg px-0.5 py-0.5">
            {(['table', 'funnel'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                  v === view
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-gray-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'table'
        ? <TableView yearPeriods={yearPeriods} priorYearPeriods={priorYearPeriods} year={year} accentColor={accentColor} />
        : <FunnelView yearPeriods={yearPeriods} year={year} accentColor={accentColor} />}
    </div>
  );
}

// ─── Table view ──────────────────────────────────────────────────────────────

interface ViewProps {
  yearPeriods:      GuildFunnelPeriod[];
  priorYearPeriods?: GuildFunnelPeriod[];
  year:             number;
  accentColor:      string;
}

function fmtSignedPct(v: number): string {
  if (v === 0) return '—';
  const sign = v > 0 ? '+' : '';
  return sign + Math.round(v * 100) + '%';
}

function TableView({ yearPeriods, priorYearPeriods = [], year }: ViewProps) {
  // Build a sparse lookup: month (1..12) → metrics; missing months show as blanks
  const byMonth = new Map<number, GuildFunnelMetrics>();
  yearPeriods.forEach(p => byMonth.set(p.month, p.metrics));

  function quarterMetrics(q: number): GuildFunnelMetrics | null {
    const months = yearPeriods.filter(p => Math.ceil(p.month / 3) === q);
    return months.length > 0 ? aggregateMetrics(months) : null;
  }

  function yearMetrics(): GuildFunnelMetrics | null {
    return yearPeriods.length > 0 ? aggregateMetrics(yearPeriods) : null;
  }

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleDateString('en-GB', { month: 'short' })
  );

  type Section = 'leads' | 'evs' | 'bookings';
  type Row = {
    section:    Section;
    sectionLabel: string;
    label:      string;
    sublabel?:  string;          // shown when this row belongs to a sub-block (Conv inside EV's)
    isFirst:    boolean;         // first row of its section
    isTotal:    boolean;
    isSubFirst?: boolean;        // first row of the Conversion sub-block
    format:     (v: number) => string;
    pick:       (m: GuildFunnelMetrics) => number;
  };

  const rows: Row[] = [
    // ── Leads (light) ─────────────────────────────────────
    { section: 'leads', sectionLabel: 'Leads', label: 'New',       isFirst: true,  isTotal: false, format: fmtNum, pick: m => m.newLeads       },
    { section: 'leads', sectionLabel: 'Leads', label: 'Recurring', isFirst: false, isTotal: false, format: fmtNum, pick: m => m.recurringLeads },
    { section: 'leads', sectionLabel: 'Leads', label: 'Total',     isFirst: false, isTotal: true,  format: fmtNum, pick: m => m.totalLeads     },
    // ── EV's + Conversion (medium) ────────────────────────
    { section: 'evs', sectionLabel: "EV's", label: 'New',       isFirst: true,  isTotal: false, format: fmtNum, pick: m => m.newEVs       },
    { section: 'evs', sectionLabel: "EV's", label: 'Recurring', isFirst: false, isTotal: false, format: fmtNum, pick: m => m.recurringEVs },
    { section: 'evs', sectionLabel: "EV's", label: 'Total',     isFirst: false, isTotal: true,  format: fmtNum, pick: m => m.totalEVs     },
    { section: 'evs', sectionLabel: "EV's", label: 'New',       sublabel: 'Conversion', isFirst: false, isTotal: false, isSubFirst: true, format: fmtPct, pick: m => m.newConversion       },
    { section: 'evs', sectionLabel: "EV's", label: 'Recurring', sublabel: 'Conversion', isFirst: false, isTotal: false, format: fmtPct, pick: m => m.recurringConversion },
    { section: 'evs', sectionLabel: "EV's", label: 'Total',     sublabel: 'Conversion', isFirst: false, isTotal: true,  format: fmtPct, pick: m => m.totalConversion     },
    // ── Bookings (dark — the outcome) ─────────────────────
    { section: 'bookings', sectionLabel: 'Bookings', label: 'New',       isFirst: true,  isTotal: false, format: fmtEUR, pick: m => m.newBookings       },
    { section: 'bookings', sectionLabel: 'Bookings', label: 'Recurring', isFirst: false, isTotal: false, format: fmtEUR, pick: m => m.recurringBookings },
    { section: 'bookings', sectionLabel: 'Bookings', label: 'Total',     isFirst: false, isTotal: true,  format: fmtEUR, pick: m => m.totalBookings     },
  ];

  // Section-tinted styling. Each section deepens visually toward Bookings.
  // `sticky` must be opaque so it hides scrolled content under it.
  function styleFor(section: Section, isTotal: boolean) {
    if (section === 'bookings') {
      return isTotal
        ? { row: 'bg-slate-800 text-white',           sticky: 'bg-slate-800',     weight: 'font-bold',      muted: 'text-slate-300' }
        : { row: 'bg-slate-100/80 text-slate-800',    sticky: 'bg-slate-100',     weight: 'font-semibold',  muted: 'text-slate-500' };
    }
    if (section === 'evs') {
      return isTotal
        ? { row: 'bg-slate-100/80 text-slate-900',    sticky: 'bg-slate-100',     weight: 'font-semibold',  muted: 'text-slate-500' }
        : { row: 'bg-white text-slate-700',           sticky: 'bg-white',         weight: 'font-medium',    muted: 'text-slate-400' };
    }
    return isTotal
      ? { row: 'bg-slate-100/80 text-slate-900',      sticky: 'bg-slate-100',     weight: 'font-semibold',  muted: 'text-slate-500' }
      : { row: 'bg-white text-slate-700',             sticky: 'bg-white',         weight: 'font-medium',    muted: 'text-slate-400' };
  }

  const q1 = quarterMetrics(1);
  const q2 = quarterMetrics(2);
  const q3 = quarterMetrics(3);
  const q4 = quarterMetrics(4);
  const yr = yearMetrics();

  if (yearPeriods.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-10 text-center text-slate-400 text-sm">
        No data available for {year}.
      </div>
    );
  }

  // ── YoY plumbing ────────────────────────────────────────
  const priorByMonth = new Map<number, GuildFunnelMetrics>();
  priorYearPeriods.forEach(p => priorByMonth.set(p.month, p.metrics));
  function priorQuarterMetrics(q: number): GuildFunnelMetrics | null {
    const months = priorYearPeriods.filter(p => Math.ceil(p.month / 3) === q);
    return months.length > 0 ? aggregateMetrics(months) : null;
  }
  function priorYearMetrics(): GuildFunnelMetrics | null {
    return priorYearPeriods.length > 0 ? aggregateMetrics(priorYearPeriods) : null;
  }
  const hasYoy = priorYearPeriods.length > 0;

  function yoyDelta(curMetric: GuildFunnelMetrics | null, prevMetric: GuildFunnelMetrics | null, pick: (m: GuildFunnelMetrics) => number): number | null {
    if (!curMetric || !prevMetric) return null;
    const prev = pick(prevMetric);
    if (prev === 0) return null;
    return (pick(curMetric) - prev) / Math.abs(prev);
  }

  type YoyRow = { label: string; isFirst: boolean; pick: (m: GuildFunnelMetrics) => number };
  const yoyRows: YoyRow[] = hasYoy ? [
    { label: 'Leads',     isFirst: true,  pick: m => m.totalLeads    },
    { label: "EV's",      isFirst: false, pick: m => m.totalEVs      },
    { label: 'Bookings',  isFirst: false, pick: m => m.totalBookings },
  ] : [];

  function renderYoyCell(delta: number | null, key: string | number, extraCls = '') {
    if (delta === null) {
      return <td key={key} className={`px-3 py-2 text-right text-gray-300 ${extraCls}`}>—</td>;
    }
    const color = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400';
    return <td key={key} className={`px-3 py-2 text-right font-semibold ${color} ${extraCls}`}>{fmtSignedPct(delta)}</td>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] tabular-nums">
          <colgroup>
            <col style={{ width: '210px' }} />
            {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '84px' }} />)}
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '112px' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="sticky left-0 z-20 bg-gray-50 backdrop-blur px-4 py-3 text-left">Metric</th>
              {monthLabels.map((lbl, i) => (
                <th key={i} className="px-3 py-3 text-right">{lbl}</th>
              ))}
              <th className="px-3 py-3 text-right bg-slate-50">Q1</th>
              <th className="px-3 py-3 text-right bg-slate-50">Q2</th>
              <th className="px-3 py-3 text-right bg-slate-50">Q3</th>
              <th className="px-3 py-3 text-right bg-slate-50">Q4</th>
              <th className="px-3 py-3 text-right bg-slate-100 text-slate-700">{year}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const s = styleFor(row.section, row.isTotal);
              const borderCls = row.isFirst
                ? 'border-t-[3px] border-gray-200'
                : row.isSubFirst
                  ? 'border-t-[1.5px] border-gray-200/80'
                  : 'border-t border-gray-50';

              return (
                <tr key={`${row.section}-${row.label}-${row.sublabel ?? ''}-${i}`} className={`${s.row} ${borderCls} transition-colors`}>
                  <td className={`sticky left-0 z-10 ${s.sticky} px-4 py-2`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.12em] w-[88px] flex-shrink-0 ${s.muted}`}>
                        {row.isFirst ? row.sectionLabel : row.isSubFirst ? '↳ Conversion' : ''}
                      </span>
                      <span className={`${s.weight}`}>{row.label}</span>
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, mi) => {
                    const m = byMonth.get(mi + 1);
                    return (
                      <td key={mi} className={`px-3 py-2 text-right ${s.weight}`}>
                        {m ? row.format(row.pick(m)) : <span className={s.muted}>—</span>}
                      </td>
                    );
                  })}
                  {[q1, q2, q3, q4].map((q, qi) => (
                    <td key={qi} className={`px-3 py-2 text-right ${s.weight} ${row.section === 'bookings' ? (row.isTotal ? 'bg-black/10' : 'bg-black/5') : (row.isTotal ? 'bg-slate-200/40' : 'bg-slate-50/60')}`}>
                      {q ? row.format(row.pick(q)) : <span className={s.muted}>—</span>}
                    </td>
                  ))}
                  <td className={`px-3 py-2 text-right font-bold ${row.section === 'bookings' ? (row.isTotal ? 'bg-black/15' : 'bg-black/10') : (row.isTotal ? 'bg-slate-200/60' : 'bg-slate-100/60')}`}>
                    {yr ? row.format(row.pick(yr)) : <span className={s.muted}>—</span>}
                  </td>
                </tr>
              );
            })}

            {/* ── YoY section ───────────────────────────── */}
            {hasYoy && yoyRows.map((row, i) => (
              <tr key={`yoy-${row.label}`} className={`${row.isFirst ? 'border-t-[3px] border-gray-200' : 'border-t border-gray-50'} bg-slate-50/40 text-slate-700`}>
                <td className="sticky left-0 z-10 bg-slate-50/95 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] w-[88px] flex-shrink-0 text-slate-500">
                      {row.isFirst ? `YoY vs ${year - 1}` : ''}
                    </span>
                    <span className="font-semibold">{row.label}</span>
                  </div>
                </td>
                {Array.from({ length: 12 }, (_, mi) => {
                  const d = yoyDelta(byMonth.get(mi + 1) ?? null, priorByMonth.get(mi + 1) ?? null, row.pick);
                  return renderYoyCell(d, mi);
                })}
                {[1, 2, 3, 4].map(qNum => {
                  const cur  = quarterMetrics(qNum);
                  const prev = priorQuarterMetrics(qNum);
                  const d = yoyDelta(cur, prev, row.pick);
                  return renderYoyCell(d, `q${qNum}`, 'bg-slate-100/50');
                })}
                {(() => {
                  const d = yoyDelta(yearMetrics(), priorYearMetrics(), row.pick);
                  return renderYoyCell(d, 'yr', 'bg-slate-200/40 font-bold');
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Funnel view ─────────────────────────────────────────────────────────────

function FunnelView({ yearPeriods, year, accentColor }: ViewProps) {
  // Period selector inside funnel view: month / quarter / year
  type Granularity = 'month' | 'quarter' | 'year';

  const monthOpts = yearPeriods.map(p => ({
    key:    `month:${p.month}`,
    label:  p.label,
    metrics: p.metrics,
    forecast: p.isForecast,
  }));

  const quarterOpts = [1, 2, 3, 4].map(q => {
    const months = yearPeriods.filter(p => Math.ceil(p.month / 3) === q);
    if (months.length === 0) return null;
    return {
      key:    `quarter:${q}`,
      label:  `Q${q} ${year}`,
      metrics: aggregateMetrics(months),
      forecast: months.every(m => m.isForecast),
    };
  }).filter(Boolean) as { key: string; label: string; metrics: GuildFunnelMetrics; forecast: boolean }[];

  const yearOpt = yearPeriods.length > 0
    ? {
        key:    `year:${year}`,
        label:  String(year),
        metrics: aggregateMetrics(yearPeriods),
        forecast: yearPeriods.every(p => p.isForecast),
      }
    : null;

  const today = new Date();
  const defaultKey = today.getFullYear() === year && monthOpts.find(o => o.key === `month:${today.getMonth() + 1}`)
    ? `month:${today.getMonth() + 1}`
    : (yearOpt?.key ?? monthOpts[monthOpts.length - 1]?.key ?? '');

  const [selKey, setSelKey] = useState(defaultKey);

  const mode: Granularity = selKey.startsWith('month:') ? 'month' : selKey.startsWith('quarter:') ? 'quarter' : 'year';
  const list = mode === 'month' ? monthOpts : mode === 'quarter' ? quarterOpts : (yearOpt ? [yearOpt] : []);
  const selected = list.find(o => o.key === selKey) ?? list[0];

  function setMode(g: Granularity) {
    const next = g === 'month' ? monthOpts[monthOpts.length - 1] : g === 'quarter' ? quarterOpts[quarterOpts.length - 1] : yearOpt;
    if (next) setSelKey(next.key);
  }

  if (!selected) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-10 text-center text-slate-400 text-sm">
        No data available for {year}.
      </div>
    );
  }

  const m = selected.metrics;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400 uppercase tracking-[0.12em]">Period</span>
          <div className="flex items-center bg-gray-100/80 ring-1 ring-inset ring-gray-200/70 rounded-lg px-0.5 py-0.5">
            {(['month', 'quarter', 'year'] as Granularity[]).map(g => (
              <button
                key={g}
                onClick={() => setMode(g)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${
                  mode === g
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-gray-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <select
          value={selKey}
          onChange={e => setSelKey(e.target.value)}
          className="appearance-none text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-slate-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300/60 cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[length:12px_12px] bg-[position:right_10px_center]"
        >
          {list.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Side-by-side funnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FunnelColumn title="New"       subtitle="New business"          leads={m.newLeads}       evs={m.newEVs}       conv={m.newConversion}       bookings={m.newBookings}       accent={accentColor} />
        <FunnelColumn title="Recurring" subtitle="Renewals + expansion"  leads={m.recurringLeads} evs={m.recurringEVs} conv={m.recurringConversion} bookings={m.recurringBookings} accent={accentColor} secondary />
      </div>

      {/* Total summary line */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card px-5 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Total</span>
            <span className="text-xs text-slate-400">{selected.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm tabular-nums">
            <span><span className="text-slate-400 font-medium mr-1">Leads</span><span className="font-semibold text-slate-800">{m.totalLeads.toLocaleString()}</span></span>
            <span className="text-slate-300">→</span>
            <span><span className="text-slate-400 font-medium mr-1">EVs</span><span className="font-semibold text-slate-800">{m.totalEVs.toLocaleString()}</span></span>
            <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-50 ring-1 ring-inset ring-slate-200/70 px-1.5 py-0.5 rounded-full tabular-nums">
              {fmtPct(m.totalConversion)}
            </span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-900 font-bold text-base">{fmtEUR(m.totalBookings)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Funnel column (used by FunnelView) ──────────────────────────────────────

interface FunnelColumnProps {
  title:      string;
  subtitle:   string;
  leads:      number;
  evs:        number;
  conv:       number;
  bookings:   number;
  accent:     string;
  secondary?: boolean;
}

function FunnelColumn({ title, subtitle, leads, evs, conv, bookings, accent, secondary }: FunnelColumnProps) {
  const leadW = 100;
  const evW   = leads > 0 ? Math.max(15, Math.round((evs / leads) * 100)) : 100;
  const bookW = leads > 0 ? Math.max(15, Math.round((evs / leads) * 80)) : 80;
  const stageOpacity = secondary ? 0.45 : 0.85;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.12em]">{title}</h3>
        <span className="text-[10.5px] font-medium text-slate-400">{subtitle}</span>
      </div>

      <div className="space-y-2">
        <FunnelStage label="Leads"    value={leads.toLocaleString()} width={leadW} accent={accent} opacity={stageOpacity} />
        <FunnelArrow conv={conv} />
        <FunnelStage label="EV's"     value={evs.toLocaleString()}   width={evW}   accent={accent} opacity={stageOpacity} />
        <FunnelArrow />
        <FunnelStage label="Bookings" value={fmtEUR(bookings)}        width={bookW} accent={accent} opacity={stageOpacity} bold />
      </div>
    </div>
  );
}

function FunnelStage({ label, value, width, accent, opacity, bold }: { label: string; value: string; width: number; accent: string; opacity: number; bold?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-500 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
        <div
          className="h-full rounded-lg transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: accent, opacity }}
        />
        <span className={`absolute inset-0 flex items-center justify-end px-3 text-sm tabular-nums ${bold ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function FunnelArrow({ conv }: { conv?: number }) {
  return (
    <div className="flex items-center justify-center -my-0.5 relative ml-[76px]">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
      {conv !== undefined && (
        <span className="ml-2 text-[10px] font-semibold text-slate-600 bg-slate-50 ring-1 ring-inset ring-slate-200/70 px-1.5 py-0.5 rounded-full tabular-nums">
          {fmtPct(conv)}
        </span>
      )}
    </div>
  );
}
