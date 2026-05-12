'use client';

import { useMemo, useState } from 'react';
import { GuildFunnelData, GuildFunnelMetrics, GuildFunnelPeriod } from '@/lib/types';

type Granularity = 'month' | 'quarter' | 'year';

interface PeriodOption {
  type:       Granularity;
  key:        string;
  label:      string;
  year:       number;
  month?:     number;
  quarter?:   number;
  metrics:    GuildFunnelMetrics;
  isForecast: boolean;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtEUR(v: number): string {
  if (v === 0) return '€0';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return '€' + (v / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return '€' + Math.round(v / 1000).toLocaleString() + 'k';
  return '€' + Math.round(v).toLocaleString();
}

function fmtPct(v: number): string {
  return Math.round(v * 100) + '%';
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

function buildOptions(periods: GuildFunnelPeriod[]): PeriodOption[] {
  const opts: PeriodOption[] = [];

  for (const p of periods) {
    opts.push({
      type: 'month',
      key:  `month:${p.key}`,
      label: p.label,
      year:  p.year,
      month: p.month,
      metrics: p.metrics,
      isForecast: p.isForecast,
    });
  }

  const byQuarter = new Map<string, GuildFunnelPeriod[]>();
  for (const p of periods) {
    const q = Math.ceil(p.month / 3);
    const k = `${p.year}-Q${q}`;
    if (!byQuarter.has(k)) byQuarter.set(k, []);
    byQuarter.get(k)!.push(p);
  }
  byQuarter.forEach((ms, k) => {
    const [y, qStr] = k.split('-Q');
    const year = +y, quarter = +qStr;
    opts.push({
      type: 'quarter',
      key:  `quarter:${k}`,
      label: `Q${quarter} ${year}`,
      year, quarter,
      metrics: aggregateMetrics(ms),
      isForecast: ms.every(m => m.isForecast),
    });
  });

  const byYear = new Map<number, GuildFunnelPeriod[]>();
  for (const p of periods) {
    if (!byYear.has(p.year)) byYear.set(p.year, []);
    byYear.get(p.year)!.push(p);
  }
  byYear.forEach((ms, y) => {
    opts.push({
      type: 'year',
      key:  `year:${y}`,
      label: String(y),
      year:  y,
      metrics: aggregateMetrics(ms),
      isForecast: ms.every(m => m.isForecast),
    });
  });

  return opts;
}

// ─── Main view ───────────────────────────────────────────────────────────────

interface GuildFunnelViewProps {
  data:        GuildFunnelData;
  accentColor: string;
}

export default function GuildFunnelView({ data, accentColor }: GuildFunnelViewProps) {
  const allOptions = useMemo(() => buildOptions(data.periods), [data]);
  const monthOpts   = useMemo(() => allOptions.filter(o => o.type === 'month').sort((a, b)   => b.key.localeCompare(a.key)), [allOptions]);
  const quarterOpts = useMemo(() => allOptions.filter(o => o.type === 'quarter').sort((a, b) => b.key.localeCompare(a.key)), [allOptions]);
  const yearOpts    = useMemo(() => allOptions.filter(o => o.type === 'year').sort((a, b)    => b.year - a.year), [allOptions]);

  const defaultKey = useMemo(() => {
    const today = new Date();
    const thisMonthKey = `month:${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return (
      monthOpts.find(o => o.key === thisMonthKey)?.key
      ?? monthOpts.find(o => o.isForecast)?.key
      ?? monthOpts[0]?.key
      ?? ''
    );
  }, [monthOpts]);

  const [selKey, setSelKey] = useState(defaultKey);
  const selected = allOptions.find(o => o.key === selKey) ?? allOptions.find(o => o.key === defaultKey) ?? allOptions[0];

  function setMode(newMode: Granularity) {
    const list = newMode === 'month' ? monthOpts : newMode === 'quarter' ? quarterOpts : yearOpts;
    const aligned = list.find(o => o.year === selected.year) ?? list[0];
    if (aligned) setSelKey(aligned.key);
  }

  if (!selected) return null;
  const m = selected.metrics;
  const mode = selected.type;
  const currentList = mode === 'month' ? monthOpts : mode === 'quarter' ? quarterOpts : yearOpts;

  return (
    <div className="space-y-5">
      {/* ── Period selector ───────────────── */}
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
          {selected.isForecast && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-200/70 px-2 py-0.5 rounded-full">
              Forecast
            </span>
          )}
        </div>

        <select
          value={selKey}
          onChange={e => setSelKey(e.target.value)}
          className="appearance-none text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-slate-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300/60 cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[length:12px_12px] bg-[position:right_10px_center]"
        >
          {currentList.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Side-by-side funnels ──────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FunnelColumn
          title="New"
          subtitle="New business"
          leads={m.newLeads}
          evs={m.newEVs}
          conv={m.newConversion}
          bookings={m.newBookings}
          accent={accentColor}
        />
        <FunnelColumn
          title="Recurring"
          subtitle="Renewals + expansion"
          leads={m.recurringLeads}
          evs={m.recurringEVs}
          conv={m.recurringConversion}
          bookings={m.recurringBookings}
          accent={accentColor}
          secondary
        />
      </div>

      {/* ── Total summary line ─────────────── */}
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

      {/* ── Monthly chart ─────────────────── */}
      <MonthlyChart periods={data.periods} accentColor={accentColor} selected={selected} />
    </div>
  );
}

// ─── Funnel column ───────────────────────────────────────────────────────────

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
  const bookW = leads > 0 ? Math.max(15, Math.round((evs / leads) * 100) * 0.8) : 80;
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

// ─── Monthly chart ───────────────────────────────────────────────────────────

interface MonthlyChartProps {
  periods:     GuildFunnelPeriod[];
  accentColor: string;
  selected:    PeriodOption;
}

function MonthlyChart({ periods, accentColor, selected }: MonthlyChartProps) {
  const sorted = useMemo(() => [...periods].sort((a, b) => a.key.localeCompare(b.key)), [periods]);
  if (sorted.length === 0) return null;

  const maxBookings = Math.max(...sorted.map(p => p.metrics.totalBookings), 1);

  function isHighlighted(p: GuildFunnelPeriod): boolean {
    if (selected.type === 'month')   return p.year === selected.year && p.month === selected.month;
    if (selected.type === 'quarter') return p.year === selected.year && Math.ceil(p.month / 3) === selected.quarter;
    if (selected.type === 'year')    return p.year === selected.year;
    return false;
  }

  // Detect transitions to draw year separators
  const transitions = new Set<number>();
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].year !== sorted[i - 1].year) transitions.add(i);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-5">
      <div className="flex items-baseline justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-800">Monthly Total Bookings</h3>
        <div className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.85 }} />
            Actuals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
            Forecast
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1 h-36 relative">
        {sorted.map((p, i) => {
          const h = Math.max(2, Math.round((p.metrics.totalBookings / maxBookings) * 100));
          const highlighted = isHighlighted(p);
          const showYearTransition = transitions.has(i);
          return (
            <div key={p.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 group cursor-pointer relative">
              {showYearTransition && (
                <span className="absolute -left-1 inset-y-0 w-px bg-gray-200" aria-hidden="true" />
              )}
              <div className="w-full flex flex-col-reverse h-full">
                <div
                  className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-100"
                  style={{
                    height:          `${h}%`,
                    backgroundColor: accentColor,
                    opacity:         highlighted ? 1 : (p.isForecast ? 0.4 : 0.85),
                    outline:         highlighted ? `2px solid ${accentColor}` : 'none',
                    outlineOffset:   highlighted ? '2px' : '0',
                  }}
                  title={`${p.label}: ${fmtEUR(p.metrics.totalBookings)}`}
                />
              </div>
              <span className="text-[9px] font-semibold text-slate-400 tabular-nums truncate w-full text-center uppercase">
                {new Date(p.year, p.month - 1, 1).toLocaleDateString('en-GB', { month: 'short' }).slice(0, 1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Year labels under the chart */}
      <div className="mt-1 flex items-center text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em]">
        {Array.from(new Set(sorted.map(p => p.year))).map(year => {
          const count = sorted.filter(p => p.year === year).length;
          const total = sorted.length;
          return (
            <span
              key={year}
              className="text-center border-t border-gray-200 pt-1.5"
              style={{ flexBasis: `${(count / total) * 100}%` }}
            >
              {year}
            </span>
          );
        })}
      </div>
    </div>
  );
}
