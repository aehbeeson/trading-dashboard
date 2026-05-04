'use client';

import { useState } from 'react';
import { Deal } from '@/lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtFull(v: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}
function fmtK(v: number) {
  return v === 0 ? '—' : '€' + Math.round(v / 1000) + 'k';
}
function fmtDate(s: string) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function sum(deals: Deal[]) { return deals.reduce((s, d) => s + d.value, 0); }

function parseWeekKey(s: string): number {
  const parts = s.trim().split(/\s+/);
  if (parts.length === 2) return (parseInt(parts[1]) || 0) * 100 + (parseInt(parts[0]) || 0);
  return parseInt(s) || 0;
}

interface Yoy { priorTotal: number; delta: number; pct: number }

function calcYoy(current: number, prior: number | null): Yoy | null {
  if (prior === null) return null;
  const delta = current - prior;
  const pct   = prior > 0 ? (delta / prior) * 100 : 0;
  return { priorTotal: prior, delta, pct };
}

function YoyCell({ yoy, size = 'sm' }: { yoy: Yoy | null | undefined; size?: 'xs' | 'sm' }) {
  if (!yoy) return <span className="text-gray-300 tabular-nums">—</span>;
  const pos   = yoy.delta >= 0;
  const color = pos ? 'text-emerald-600' : 'text-red-500';
  const sign  = pos ? '+' : '';
  const ts    = size === 'xs' ? 'text-xs' : 'text-sm';
  return (
    <span className={`${color} ${ts} tabular-nums font-medium`}>
      {sign}{fmtK(yoy.delta)}{' '}
      <span className="opacity-70 text-xs">({sign}{Math.round(yoy.pct)}%)</span>
    </span>
  );
}

// ─── Tree builders ────────────────────────────────────────────────────────────

type MonthMap   = Record<number, Deal[]>;
type QuarterMap = Record<number, MonthMap>;
type YearMap    = Record<number, QuarterMap>;

function buildYearTree(deals: Deal[]): YearMap {
  const tree: YearMap = {};
  for (const d of deals) {
    if (!d.closeDate) continue;
    const dt = new Date(d.closeDate + 'T00:00:00');
    if (isNaN(dt.getTime())) continue;
    const y = dt.getFullYear();
    const q = Math.ceil((dt.getMonth() + 1) / 3);
    const m = dt.getMonth() + 1;
    ((tree[y] ??= {})[q] ??= {})[m] ??= [];
    tree[y][q][m].push(d);
  }
  return tree;
}

function buildWeekMap(deals: Deal[]): Record<string, Deal[]> {
  const map: Record<string, Deal[]> = {};
  for (const d of deals) {
    const w = d.closeWeekNo?.trim() || 'Unknown';
    (map[w] ??= []).push(d);
  }
  return map;
}

function yearDeals(tree: YearMap, y: number): Deal[] {
  if (!tree[y]) return [];
  return Object.values(tree[y]).flatMap(q => Object.values(q).flat());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DealTable({ deals }: { deals: Deal[] }) {
  const sorted = [...deals].sort((a, b) => b.value - a.value);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-100 text-left text-gray-500 uppercase tracking-wide">
            <th className="pl-6 pr-3 py-2 font-medium">Company</th>
            <th className="px-3 py-2 font-medium">Owner</th>
            <th className="px-3 py-2 font-medium">Stage</th>
            <th className="px-3 py-2 text-right font-medium">ARR</th>
            <th className="px-3 py-2 font-medium">Close Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(d => (
            <tr key={d.id} className="bg-white hover:bg-gray-50 transition-colors">
              <td className="pl-6 pr-3 py-2 font-medium text-slate-700">{d.company}</td>
              <td className="px-3 py-2 text-gray-500">{d.owner}</td>
              <td className="px-3 py-2 text-gray-500">{d.stage}</td>
              <td className="px-3 py-2 text-right font-semibold text-slate-700">{fmtFull(d.value)}</td>
              <td className="px-3 py-2 text-gray-400">{fmtDate(d.closeDate)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-slate-700">
            <td className="pl-6 pr-3 py-2" colSpan={3}>{deals.length} deal{deals.length !== 1 ? 's' : ''}</td>
            <td className="px-3 py-2 text-right">{fmtFull(sum(deals))}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Row inside a year card (quarter or month level)
interface PeriodRowProps {
  label:       string;
  count:       number;
  total:       number;
  yoy:         Yoy | null;
  depth:       1 | 2;   // 1=quarter, 2=month
  open:        boolean;
  onToggle:    () => void;
  accentColor: string;
}

function PeriodRow({ label, count, total, yoy, depth, open, onToggle, accentColor }: PeriodRowProps) {
  const pl        = depth === 1 ? 5 : 10;
  const size      = depth === 1 ? 'text-sm font-semibold text-slate-700' : 'text-sm font-medium text-slate-600';
  const borderLeft = depth === 1 ? `4px solid ${accentColor}40` : 'none';
  const pyClass   = depth === 1 ? 'py-3' : 'py-2.5';

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-4 pr-4 hover:bg-gray-50 text-left transition-colors ${pyClass}`}
      style={{ paddingLeft: `${pl * 4}px`, borderLeft }}
    >
      <span className={`${size} flex-1`}>{label}</span>
      <span className="text-xs text-gray-400 w-16 text-right tabular-nums">{count} deal{count !== 1 ? 's' : ''}</span>
      <span className={`${size} w-24 text-right tabular-nums`}>{fmtK(total)}</span>
      <span className="w-44 text-right">
        <YoyCell yoy={yoy} size="xs" />
      </span>
      <span className="text-gray-400 text-[10px] w-3">{open ? '▴' : '▾'}</span>
    </button>
  );
}

// ─── Toggle state helper ──────────────────────────────────────────────────────

function useToggleSet<T>(initial: T[]) {
  const [set, setSet] = useState(new Set<T>(initial));
  function toggle(val: T) {
    setSet(prev => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val); else next.add(val);
      return next;
    });
  }
  return { set, toggle };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PriorPeriodViewProps {
  deals:       Deal[];
  accentColor: string;
}

export default function PriorPeriodView({ deals, accentColor }: PriorPeriodViewProps) {
  const [view, setView] = useState<'period' | 'week'>('period');

  const now  = new Date();
  const curY = now.getFullYear();
  const curQ = Math.ceil((now.getMonth() + 1) / 3);

  const quarters = useToggleSet<string>([]);
  const months   = useToggleSet<string>([]);
  const weeks    = useToggleSet<string>([]);

  const won  = deals.filter(d => d.probability >= 0.99);
  const lost = deals.filter(d => d.probability <= 0.01);

  const tree    = buildYearTree(won);
  const weekMap = buildWeekMap(won);

  const yearKeys = Object.keys(tree).map(Number).sort((a, b) => b - a);
  const weekKeys = Object.keys(weekMap).sort((a, b) => parseWeekKey(b) - parseWeekKey(a));

  // Best month and best quarter across all history
  let biggestMonth: { label: string; total: number } | null = null;
  let biggestQuarter: { label: string; total: number } | null = null;
  for (const y of yearKeys) {
    for (const q of Object.keys(tree[y]).map(Number)) {
      const qDeals = Object.values(tree[y][q]).flat();
      const qTotal = sum(qDeals);
      if (!biggestQuarter || qTotal > biggestQuarter.total) {
        biggestQuarter = { label: `Q${q} ${y}`, total: qTotal };
      }
      for (const m of Object.keys(tree[y][q]).map(Number)) {
        const mTotal = sum(tree[y][q][m]);
        if (!biggestMonth || mTotal > biggestMonth.total) {
          biggestMonth = { label: `${MONTH_NAMES[m - 1]} ${y}`, total: mTotal };
        }
      }
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Summary cards + view toggle ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-4 flex-1">
          {[
            { label: 'Best Month',   stat: biggestMonth },
            { label: 'Best Quarter', stat: biggestQuarter },
          ].map(({ label, stat }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 px-5 py-3.5 flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              {stat ? (
                <>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{stat.label}</p>
                  <p className="text-xl font-bold text-emerald-600">{fmtFull(stat.total)}</p>
                </>
              ) : (
                <p className="text-lg font-bold text-gray-300 mt-0.5">—</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
          {(['period', 'week'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === v ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v === 'period' ? 'By Period' : 'By Week'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Period view — one card per year ── */}
      {view === 'period' && (
        <div className="space-y-5">
          {yearKeys.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-10 text-center text-sm text-gray-400">
              No Closed Won deals found.
            </div>
          ) : (
            yearKeys.map(y => {
              const priorY     = y - 1;
              const yDeals     = yearDeals(tree, y);
              const priorDeals = yearDeals(tree, priorY);
              const yTotal     = sum(yDeals);
              const priorTotal = priorDeals.length > 0 ? sum(priorDeals) : null;
              const yoyYear    = calcYoy(yTotal, priorTotal);

              return (
                <div key={y} className="bg-white rounded-xl border border-gray-200 overflow-hidden">

                  {/* Year header */}
                  <div
                    style={{ backgroundColor: '#1e3a5f' }}
                    className="flex items-center gap-4 px-5 py-3.5 text-white"
                  >
                    <span className="text-base font-bold flex-1">{y}</span>
                    <span className="text-xs text-slate-400 w-16 text-right tabular-nums">
                      {yDeals.length} deal{yDeals.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-base font-bold w-24 text-right tabular-nums">{fmtK(yTotal)}</span>
                    <span className="w-44 text-right">
                      {yoyYear ? (
                        <span className={`text-sm font-medium tabular-nums ${yoyYear.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {yoyYear.delta >= 0 ? '+' : ''}{fmtK(yoyYear.delta)}{' '}
                          <span className="opacity-75 text-xs">
                            ({yoyYear.delta >= 0 ? '+' : ''}{Math.round(yoyYear.pct)}% vs {priorY})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">no prior year data</span>
                      )}
                    </span>
                    <span className="w-3" /> {/* spacer to align with toggle arrows below */}
                  </div>

                  {/* Column sub-header */}
                  <div className="flex items-center gap-4 px-5 py-2 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                    <span className="flex-1">Period</span>
                    <span className="w-16 text-right">Deals</span>
                    <span className="w-24 text-right">Total</span>
                    <span className="w-44 text-right">vs {priorY}</span>
                    <span className="w-3" />
                  </div>

                  {/* Quarter / Month rows */}
                  <div className="divide-y divide-gray-100">
                    {Object.keys(tree[y]).map(Number).sort((a, b) => b - a).map(q => {
                      const qKey      = `${y}-Q${q}`;
                      const qOpen     = quarters.set.has(qKey);
                      const qDeals    = Object.values(tree[y][q]).flat();
                      const qTotal    = sum(qDeals);
                      const priorQDeals = tree[priorY]?.[q] ? Object.values(tree[priorY][q]).flat() : null;
                      const priorQTotal = priorQDeals ? sum(priorQDeals) : null;
                      const qYoy      = calcYoy(qTotal, priorQTotal);

                      return (
                        <div key={q}>
                          <PeriodRow
                            label={`Q${q} ${y}`} count={qDeals.length} total={qTotal} yoy={qYoy}
                            depth={1} open={qOpen} accentColor={accentColor}
                            onToggle={() => quarters.toggle(qKey)}
                          />

                          {qOpen && Object.keys(tree[y][q]).map(Number).sort((a, b) => b - a).map(m => {
                            const mKey      = `${y}-Q${q}-${m}`;
                            const mOpen     = months.set.has(mKey);
                            const mDeals    = tree[y][q][m];
                            const mTotal    = sum(mDeals);
                            const priorMDeals = tree[priorY]?.[q]?.[m] ?? null;
                            const priorMTotal = priorMDeals ? sum(priorMDeals) : null;
                            const mYoy      = calcYoy(mTotal, priorMTotal);

                            return (
                              <div key={m} className="border-t border-gray-100">
                                <PeriodRow
                                  label={`${MONTH_NAMES[m - 1]} ${y}`} count={mDeals.length} total={mTotal} yoy={mYoy}
                                  depth={2} open={mOpen} accentColor={accentColor}
                                  onToggle={() => months.toggle(mKey)}
                                />
                                {mOpen && <DealTable deals={mDeals} />}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Weekly view ── */}
      {view === 'week' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {weekKeys.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">
              No week data found — check the Close Week No column is present in the sheet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {weekKeys.map(w => {
                const wOpen  = weeks.set.has(w);
                const wDeals = weekMap[w];
                const wTotal = sum(wDeals);
                return (
                  <div key={w}>
                    <button
                      onClick={() => weeks.toggle(w)}
                      className="w-full flex items-center gap-4 px-5 py-2.5 hover:bg-gray-50 text-left transition-colors"
                    >
                      <span className="text-sm font-medium text-slate-700 flex-1">Week {w}</span>
                      <span className="text-xs text-gray-400 w-16 text-right tabular-nums">
                        {wDeals.length} deal{wDeals.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 w-24 text-right tabular-nums">{fmtK(wTotal)}</span>
                      <span className="text-gray-400 text-[10px] w-3">{wOpen ? '▴' : '▾'}</span>
                    </button>
                    {wOpen && <DealTable deals={wDeals} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
