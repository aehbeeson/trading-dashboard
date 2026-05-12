'use client';

import { CSSProperties, Fragment, useMemo, useState } from 'react';
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

// Linear interp from white toward the accent. amount=0 → white, 1 → full accent.
function tint(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const m = (c: number) => Math.round(255 - (255 - c) * amount);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}
// Darken an accent toward black. amount=0 unchanged, 1 → black.
function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const d = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${d(r)}, ${d(g)}, ${d(b)})`;
}

function TableView({ yearPeriods, priorYearPeriods = [], year, accentColor }: ViewProps) {
  if (yearPeriods.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-10 text-center text-slate-400 text-sm">
        No data available for {year}.
      </div>
    );
  }

  // ── Aggregations ───────────────────────────────────────
  const byMonth = new Map<number, GuildFunnelMetrics>();
  yearPeriods.forEach(p => byMonth.set(p.month, p.metrics));

  function quarterMetrics(periods: GuildFunnelPeriod[], q: number) {
    const months = periods.filter(p => Math.ceil(p.month / 3) === q);
    return months.length > 0 ? aggregateMetrics(months) : null;
  }
  function yearMetrics(periods: GuildFunnelPeriod[]) {
    return periods.length > 0 ? aggregateMetrics(periods) : null;
  }

  const q1 = quarterMetrics(yearPeriods, 1);
  const q2 = quarterMetrics(yearPeriods, 2);
  const q3 = quarterMetrics(yearPeriods, 3);
  const q4 = quarterMetrics(yearPeriods, 4);
  const yr = yearMetrics(yearPeriods);

  const monthLabels = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleDateString('en-GB', { month: 'short' })
  );

  // ── Row definitions ────────────────────────────────────
  type Section = 'leads' | 'evs' | 'conversion' | 'bookings';
  interface Row {
    section:      Section;
    sectionLabel: string;
    label:        string;
    isFirst:      boolean;     // first row of its section — section label shown
    isTotal:      boolean;
    format:       (v: number) => string;
    pick:         (m: GuildFunnelMetrics) => number;
  }

  const rows: Row[] = [
    { section: 'leads',      sectionLabel: 'Leads',      label: 'New',       isFirst: true,  isTotal: false, format: fmtNum, pick: m => m.newLeads        },
    { section: 'leads',      sectionLabel: 'Leads',      label: 'Recurring', isFirst: false, isTotal: false, format: fmtNum, pick: m => m.recurringLeads  },
    { section: 'leads',      sectionLabel: 'Leads',      label: 'Total',     isFirst: false, isTotal: true,  format: fmtNum, pick: m => m.totalLeads      },
    { section: 'evs',        sectionLabel: "EV's",       label: 'New',       isFirst: true,  isTotal: false, format: fmtNum, pick: m => m.newEVs          },
    { section: 'evs',        sectionLabel: "EV's",       label: 'Recurring', isFirst: false, isTotal: false, format: fmtNum, pick: m => m.recurringEVs    },
    { section: 'evs',        sectionLabel: "EV's",       label: 'Total',     isFirst: false, isTotal: true,  format: fmtNum, pick: m => m.totalEVs        },
    { section: 'conversion', sectionLabel: 'Conversion', label: 'New',       isFirst: true,  isTotal: false, format: fmtPct, pick: m => m.newConversion       },
    { section: 'conversion', sectionLabel: 'Conversion', label: 'Recurring', isFirst: false, isTotal: false, format: fmtPct, pick: m => m.recurringConversion },
    { section: 'conversion', sectionLabel: 'Conversion', label: 'Total',     isFirst: false, isTotal: true,  format: fmtPct, pick: m => m.totalConversion     },
    { section: 'bookings',   sectionLabel: 'Bookings',   label: 'New',       isFirst: true,  isTotal: false, format: fmtEUR, pick: m => m.newBookings     },
    { section: 'bookings',   sectionLabel: 'Bookings',   label: 'Recurring', isFirst: false, isTotal: false, format: fmtEUR, pick: m => m.recurringBookings },
    { section: 'bookings',   sectionLabel: 'Bookings',   label: 'Total',     isFirst: false, isTotal: true,  format: fmtEUR, pick: m => m.totalBookings   },
  ];

  // Section-aware styling. Bookings uses the area's accent color (light tint
  // for non-totals, full accent + white for the Total row). All other sections
  // use neutral slate scales. Sticky cell bg MUST match row bg so scrolled
  // content doesn't bleed through the sticky column.
  interface SectionStyle {
    rowCls:      string;
    stickyCls:   string;
    rowStyle?:   CSSProperties;
    stickyStyle?: CSSProperties;
    weight:      string;
    muted:       string;
    qCls:        string;
    yrCls:       string;
    qStyle?:     CSSProperties;
    yrStyle?:    CSSProperties;
  }
  function styleFor(section: Section, isTotal: boolean): SectionStyle {
    if (section === 'bookings') {
      if (isTotal) {
        return {
          rowCls: 'text-white',           stickyCls: '',
          rowStyle:    { backgroundColor: accentColor },
          stickyStyle: { backgroundColor: accentColor },
          weight: 'font-bold',
          muted:  'text-white/60',
          qCls:   '',   yrCls:   '',
          qStyle:  { backgroundColor: shade(accentColor, 0.08) },
          yrStyle: { backgroundColor: shade(accentColor, 0.16) },
        };
      }
      return {
        rowCls: 'text-slate-900',         stickyCls: '',
        rowStyle:    { backgroundColor: tint(accentColor, 0.12) },
        stickyStyle: { backgroundColor: tint(accentColor, 0.12) },
        weight: 'font-semibold',
        muted:  'text-slate-500',
        qCls:   '',   yrCls:   '',
        qStyle:  { backgroundColor: tint(accentColor, 0.20) },
        yrStyle: { backgroundColor: tint(accentColor, 0.28) },
      };
    }
    if (section === 'conversion') {
      return isTotal
        ? { rowCls: 'bg-slate-100/70 text-slate-900', stickyCls: 'bg-slate-100', weight: 'font-semibold', muted: 'text-slate-400', qCls: 'bg-slate-200/40', yrCls: 'bg-slate-200/60' }
        : { rowCls: 'bg-slate-50 text-slate-700',     stickyCls: 'bg-slate-50',  weight: 'font-medium',   muted: 'text-slate-400', qCls: 'bg-slate-100/60', yrCls: 'bg-slate-100/80' };
    }
    return isTotal
      ? { rowCls: 'bg-slate-50/70 text-slate-900',    stickyCls: 'bg-slate-50',  weight: 'font-semibold', muted: 'text-slate-400', qCls: 'bg-slate-100/60', yrCls: 'bg-slate-200/40' }
      : { rowCls: 'bg-white text-slate-700',          stickyCls: 'bg-white',     weight: 'font-medium',   muted: 'text-slate-300', qCls: 'bg-slate-50/60',  yrCls: 'bg-slate-100/60' };
  }

  return (
    <div className="space-y-4">
      {/* ── Main funnel table ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] tabular-nums">
            <colgroup>
              <col style={{ width: '200px' }} />
              {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '76px' }} />)}
              <col style={{ width: '92px' }} />
              <col style={{ width: '92px' }} />
              <col style={{ width: '92px' }} />
              <col style={{ width: '92px' }} />
              <col style={{ width: '108px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left">Metric</th>
                {monthLabels.map((lbl, i) => (
                  <th key={i} className="px-3 py-3 text-right">{lbl}</th>
                ))}
                <th className="px-3 py-3 text-right bg-slate-100/70">Q1</th>
                <th className="px-3 py-3 text-right bg-slate-100/70">Q2</th>
                <th className="px-3 py-3 text-right bg-slate-100/70">Q3</th>
                <th className="px-3 py-3 text-right bg-slate-100/70">Q4</th>
                <th className="px-3 py-3 text-right bg-slate-200/70 text-slate-700">{year}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const s = styleFor(row.section, row.isTotal);
                const isNewSection = i > 0 && rows[i - 1].section !== row.section;
                return (
                  <Fragment key={`${row.section}-${row.label}-${i}`}>
                    {isNewSection && (
                      <tr aria-hidden="true">
                        <td colSpan={18} className="h-7 bg-white p-0 border-0" />
                      </tr>
                    )}
                    <tr className={s.rowCls} style={s.rowStyle}>
                      <td
                        className={`sticky left-0 z-10 ${s.stickyCls} px-4 py-2`}
                        style={s.stickyStyle}
                      >
                        <div className="flex items-baseline gap-3">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.14em] w-[80px] flex-shrink-0 ${s.muted}`}>
                            {row.isFirst ? row.sectionLabel : ''}
                          </span>
                          <span className={s.weight}>{row.label}</span>
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
                        <td key={qi} className={`px-3 py-2 text-right ${s.weight} ${s.qCls}`} style={s.qStyle}>
                          {q ? row.format(row.pick(q)) : <span className={s.muted}>—</span>}
                        </td>
                      ))}
                      <td className={`px-3 py-2 text-right font-bold ${s.yrCls}`} style={s.yrStyle}>
                        {yr ? row.format(row.pick(yr)) : <span className={s.muted}>—</span>}
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── YoY card (separate) ─────────────────────────── */}
      <YoyTable
        yearPeriods={yearPeriods}
        priorYearPeriods={priorYearPeriods}
        year={year}
        monthLabels={monthLabels}
      />
    </div>
  );
}

// ─── YoY card ────────────────────────────────────────────────────────────────

interface YoyTableProps {
  yearPeriods:      GuildFunnelPeriod[];
  priorYearPeriods: GuildFunnelPeriod[];
  year:             number;
  monthLabels:      string[];
}

function YoyTable({ yearPeriods, priorYearPeriods, year, monthLabels }: YoyTableProps) {
  if (priorYearPeriods.length === 0) return null;

  const curByMonth   = new Map<number, GuildFunnelMetrics>();
  const priorByMonth = new Map<number, GuildFunnelMetrics>();
  yearPeriods.forEach(p => curByMonth.set(p.month, p.metrics));
  priorYearPeriods.forEach(p => priorByMonth.set(p.month, p.metrics));

  function aggForQuarter(periods: GuildFunnelPeriod[], q: number) {
    const m = periods.filter(p => Math.ceil(p.month / 3) === q);
    return m.length > 0 ? aggregateMetrics(m) : null;
  }
  function aggForYear(periods: GuildFunnelPeriod[]) {
    return periods.length > 0 ? aggregateMetrics(periods) : null;
  }

  function delta(cur: GuildFunnelMetrics | null | undefined, prev: GuildFunnelMetrics | null | undefined, pick: (m: GuildFunnelMetrics) => number): number | null {
    if (!cur || !prev) return null;
    const p = pick(prev);
    if (p === 0) return null;
    return (pick(cur) - p) / Math.abs(p);
  }

  function renderCell(d: number | null, key: string | number, extraCls = '') {
    if (d === null) return <td key={key} className={`px-3 py-2 text-right text-slate-300 ${extraCls}`}>—</td>;
    const color = d > 0 ? 'text-emerald-600' : d < 0 ? 'text-rose-600' : 'text-slate-400';
    return <td key={key} className={`px-3 py-2 text-right font-semibold tabular-nums ${color} ${extraCls}`}>{fmtSignedPct(d)}</td>;
  }

  const rows = [
    { label: 'Leads',    pick: (m: GuildFunnelMetrics) => m.totalLeads    },
    { label: "EV's",     pick: (m: GuildFunnelMetrics) => m.totalEVs      },
    { label: 'Bookings', pick: (m: GuildFunnelMetrics) => m.totalBookings },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
      <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-200 flex items-baseline justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700">Year-over-Year</h3>
        <span className="text-[10.5px] font-medium text-slate-400">{year} vs {year - 1}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] tabular-nums">
          <colgroup>
            <col style={{ width: '200px' }} />
            {Array.from({ length: 12 }).map((_, i) => <col key={i} style={{ width: '76px' }} />)}
            <col style={{ width: '92px' }} />
            <col style={{ width: '92px' }} />
            <col style={{ width: '92px' }} />
            <col style={{ width: '92px' }} />
            <col style={{ width: '108px' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-200 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 text-left">Metric</th>
              {monthLabels.map((lbl, i) => (
                <th key={i} className="px-3 py-2.5 text-right">{lbl}</th>
              ))}
              <th className="px-3 py-2.5 text-right bg-slate-100/70">Q1</th>
              <th className="px-3 py-2.5 text-right bg-slate-100/70">Q2</th>
              <th className="px-3 py-2.5 text-right bg-slate-100/70">Q3</th>
              <th className="px-3 py-2.5 text-right bg-slate-100/70">Q4</th>
              <th className="px-3 py-2.5 text-right bg-slate-200/70 text-slate-700">{year}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label} className="border-t border-gray-50 hover:bg-slate-50/40 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 font-semibold text-slate-800">{row.label}</td>
                {Array.from({ length: 12 }, (_, mi) => renderCell(delta(curByMonth.get(mi + 1), priorByMonth.get(mi + 1), row.pick), mi))}
                {[1, 2, 3, 4].map(q => renderCell(delta(aggForQuarter(yearPeriods, q), aggForQuarter(priorYearPeriods, q), row.pick), `q${q}`, 'bg-slate-50/70'))}
                {renderCell(delta(aggForYear(yearPeriods), aggForYear(priorYearPeriods), row.pick), 'yr', 'bg-slate-100/70 font-bold')}
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
