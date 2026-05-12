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
        ? <TableView yearPeriods={yearPeriods} year={year} accentColor={accentColor} />
        : <FunnelView yearPeriods={yearPeriods} year={year} accentColor={accentColor} />}
    </div>
  );
}

// ─── Table view ──────────────────────────────────────────────────────────────

interface ViewProps {
  yearPeriods: GuildFunnelPeriod[];
  year:        number;
  accentColor: string;
}

function TableView({ yearPeriods, year }: ViewProps) {
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

  const rows: { label: string; group: string; format: (v: number) => string; pick: (m: GuildFunnelMetrics) => number; emphasis?: 'total' }[] = [
    { group: 'Bookings',   label: 'New',        format: fmtEUR, pick: m => m.newBookings },
    { group: 'Bookings',   label: 'Recurring',  format: fmtEUR, pick: m => m.recurringBookings },
    { group: 'Bookings',   label: 'Total',      format: fmtEUR, pick: m => m.totalBookings, emphasis: 'total' },
    { group: 'Conversion', label: 'New',        format: fmtPct, pick: m => m.newConversion },
    { group: 'Conversion', label: 'Recurring',  format: fmtPct, pick: m => m.recurringConversion },
    { group: 'Conversion', label: 'Total',      format: fmtPct, pick: m => m.totalConversion, emphasis: 'total' },
    { group: "EV's",       label: 'New',        format: fmtNum, pick: m => m.newEVs },
    { group: "EV's",       label: 'Recurring',  format: fmtNum, pick: m => m.recurringEVs },
    { group: "EV's",       label: 'Total',      format: fmtNum, pick: m => m.totalEVs, emphasis: 'total' },
    { group: 'Leads',      label: 'New',        format: fmtNum, pick: m => m.newLeads },
    { group: 'Leads',      label: 'Recurring',  format: fmtNum, pick: m => m.recurringLeads },
    { group: 'Leads',      label: 'Total',      format: fmtNum, pick: m => m.totalLeads, emphasis: 'total' },
  ];

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

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <colgroup>
            <col style={{ width: '180px' }} />
            {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '70px' }} />)}
            <col style={{ width: '88px' }} />
            <col style={{ width: '88px' }} />
            <col style={{ width: '88px' }} />
            <col style={{ width: '88px' }} />
            <col style={{ width: '96px' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              <th className="sticky left-0 z-10 bg-gray-50/95 backdrop-blur px-4 py-2.5 text-left">Metric</th>
              {monthLabels.map((lbl, i) => (
                <th key={i} className="px-2 py-2.5 text-right">{lbl}</th>
              ))}
              <th className="px-2 py-2.5 text-right bg-slate-50">Q1</th>
              <th className="px-2 py-2.5 text-right bg-slate-50">Q2</th>
              <th className="px-2 py-2.5 text-right bg-slate-50">Q3</th>
              <th className="px-2 py-2.5 text-right bg-slate-50">Q4</th>
              <th className="px-2 py-2.5 text-right bg-slate-100 text-slate-700">{year}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const prev = i > 0 ? rows[i - 1] : null;
              const startsGroup = !prev || prev.group !== row.group;
              const isTotal = row.emphasis === 'total';
              const rowCls = `${isTotal ? 'bg-slate-50/40 font-semibold text-slate-900' : 'hover:bg-slate-50/50 text-slate-700'} ${startsGroup ? 'border-t-2 border-gray-200' : 'border-t border-gray-50'}`;

              return (
                <tr key={`${row.group}-${row.label}`} className={rowCls}>
                  <td className={`sticky left-0 z-10 ${isTotal ? 'bg-slate-50/95' : 'bg-white'} backdrop-blur px-4 py-2`}>
                    <div className="flex items-center gap-2">
                      {startsGroup && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] w-[78px] flex-shrink-0">
                          {row.group}
                        </span>
                      )}
                      {!startsGroup && <span className="w-[78px] flex-shrink-0" />}
                      <span className={`${isTotal ? 'font-semibold text-slate-900' : 'font-medium text-slate-600'}`}>
                        {row.label}
                      </span>
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, mi) => {
                    const m = byMonth.get(mi + 1);
                    return (
                      <td key={mi} className="px-2 py-2 text-right">
                        {m ? row.format(row.pick(m)) : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                  {[q1, q2, q3, q4].map((q, qi) => (
                    <td key={qi} className={`px-2 py-2 text-right ${isTotal ? 'bg-slate-100/60' : 'bg-slate-50/70'}`}>
                      {q ? row.format(row.pick(q)) : <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className={`px-2 py-2 text-right font-semibold ${isTotal ? 'bg-slate-200/60 text-slate-900' : 'bg-slate-100/60 text-slate-800'}`}>
                    {yr ? row.format(row.pick(yr)) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
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
