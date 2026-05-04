'use client';

import { useState } from 'react';
import { Deal } from '@/lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtFull(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}
function fmtK(v: number) {
  return v === 0 ? '—' : '£' + Math.round(v / 1000) + 'k';
}
function fmtDate(s: string) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function sum(deals: Deal[]) { return deals.reduce((s, d) => s + d.value, 0); }

// Parse "W YYYY" week label into a sortable integer (year * 100 + week)
function parseWeekKey(s: string): number {
  const parts = s.trim().split(/\s+/);
  if (parts.length === 2) return (parseInt(parts[1]) || 0) * 100 + (parseInt(parts[0]) || 0);
  return parseInt(s) || 0;
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

interface RowProps {
  label: string;
  count: number;
  total: number;
  depth: number;       // 0=year, 1=quarter, 2=month, 3=week
  open: boolean;
  onToggle: () => void;
  accentColor: string;
}

function HierarchyRow({ label, count, total, depth, open, onToggle, accentColor }: RowProps) {
  const pl      = [5, 10, 14, 5][depth] ?? 5;
  const size    = depth === 0 ? 'text-base font-bold' : depth === 1 ? 'text-sm font-semibold' : 'text-sm font-medium';
  const textCol = depth === 0 ? 'text-slate-800' : depth === 1 ? 'text-slate-700' : 'text-slate-600';
  const bg      = depth === 0
    ? 'hover:bg-gray-50'
    : depth === 1 ? 'hover:bg-gray-50' : 'hover:bg-gray-50/60';
  const borderLeft = depth === 0 ? `4px solid ${accentColor}` : depth === 1 ? `4px solid ${accentColor}40` : 'none';
  const pyClass = depth <= 1 ? 'py-3.5' : 'py-2.5';

  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between pr-5 ${pyClass} ${bg} text-left transition-colors`}
      style={{ paddingLeft: `${pl * 4}px`, borderLeft }}
    >
      <div className="flex items-center gap-3">
        <span className={`${size} ${textCol}`}>{label}</span>
        <span className="text-xs text-gray-400">{count} deal{count !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`${size} ${textCol} tabular-nums`}>{fmtK(total)}</span>
        <span className="text-gray-400 text-[10px] w-3">{open ? '▴' : '▾'}</span>
      </div>
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

  const years    = useToggleSet<number>([curY]);
  const quarters = useToggleSet<string>([`${curY}-Q${curQ}`]);
  const months   = useToggleSet<string>([]);
  const weeks    = useToggleSet<string>([]);

  const won    = deals.filter(d => d.probability >= 0.99);
  const lost   = deals.filter(d => d.probability <= 0.01);

  const tree    = buildYearTree(won);
  const weekMap = buildWeekMap(won);

  const yearKeys = Object.keys(tree).map(Number).sort((a, b) => b - a);
  const weekKeys = Object.keys(weekMap).sort((a, b) => parseWeekKey(b) - parseWeekKey(a));

  const grandTotal  = sum(won);
  const grandLost   = sum(lost);

  return (
    <div className="space-y-5">

      {/* ── Summary cards + view toggle ── */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-4 flex-1">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5 flex items-center gap-5">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Closed Won</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{fmtFull(grandTotal)}</p>
            </div>
            <div className="w-px h-9 bg-gray-100" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Deals</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{won.length}</p>
            </div>
            {grandLost > 0 && (
              <>
                <div className="w-px h-9 bg-gray-100" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Closed Lost</p>
                  <p className="text-2xl font-bold text-red-500 mt-0.5">{fmtFull(grandLost)}</p>
                </div>
              </>
            )}
          </div>
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

      {/* ── Period hierarchy view ── */}
      {view === 'period' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {yearKeys.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No Closed Won deals found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {yearKeys.map(y => {
                const yOpen  = years.set.has(y);
                const yDeals = Object.values(tree[y]).flatMap(q => Object.values(q).flat());

                return (
                  <div key={y}>
                    <HierarchyRow
                      label={String(y)} count={yDeals.length} total={sum(yDeals)}
                      depth={0} open={yOpen} accentColor={accentColor}
                      onToggle={() => years.toggle(y)}
                    />

                    {yOpen && Object.keys(tree[y]).map(Number).sort((a, b) => b - a).map(q => {
                      const qKey   = `${y}-Q${q}`;
                      const qOpen  = quarters.set.has(qKey);
                      const qDeals = Object.values(tree[y][q]).flat();

                      return (
                        <div key={q} className="border-t border-gray-100">
                          <HierarchyRow
                            label={`Q${q} ${y}`} count={qDeals.length} total={sum(qDeals)}
                            depth={1} open={qOpen} accentColor={accentColor}
                            onToggle={() => quarters.toggle(qKey)}
                          />

                          {qOpen && Object.keys(tree[y][q]).map(Number).sort((a, b) => b - a).map(m => {
                            const mKey   = `${y}-Q${q}-${m}`;
                            const mOpen  = months.set.has(mKey);
                            const mDeals = tree[y][q][m];

                            return (
                              <div key={m} className="border-t border-gray-100">
                                <HierarchyRow
                                  label={`${MONTH_NAMES[m - 1]} ${y}`} count={mDeals.length} total={sum(mDeals)}
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
                );
              })}
            </div>
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
                return (
                  <div key={w}>
                    <HierarchyRow
                      label={`Week ${w}`} count={wDeals.length} total={sum(wDeals)}
                      depth={3} open={wOpen} accentColor={accentColor}
                      onToggle={() => weeks.toggle(w)}
                    />
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
