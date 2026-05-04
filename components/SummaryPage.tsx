'use client';

import { Deal, AreaKey, AREAS } from '@/lib/types';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}
function fmtK(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v < 0 ? '-' : '') + '£' + (abs / 1_000_000).toFixed(1) + 'M';
  return (v < 0 ? '-' : '') + '£' + Math.round(abs / 1000) + 'k';
}
function fmtPct(v: number) {
  return (v >= 0 ? '+' : '') + Math.round(v) + '%';
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

interface Metrics {
  closedWon: number;
  commit:    number;
  bestCase:  number;
  total:     number;
}

function getMetrics(deals: Deal[]): Metrics {
  return {
    closedWon: deals.filter(d => d.probability >= 0.99).reduce((s, d) => s + d.value, 0),
    commit:    deals.filter(d => d.forecastCategory === 'Commit' && d.probability < 0.99).reduce((s, d) => s + d.value, 0),
    bestCase:  deals.filter(d => d.forecastCategory === 'Best Case').reduce((s, d) => s + d.value, 0),
    total:     deals.reduce((s, d) => s + d.value, 0),
  };
}

// YoY compares closed won this calendar year vs last calendar year
// Uses the unfiltered dataset so it's not affected by the global date filter
function getYoY(allDeals: Deal[], area?: AreaKey) {
  const d    = area ? allDeals.filter(x => x.area === area) : allDeals;
  const curY = new Date().getFullYear();
  const won  = (y: number) => d
    .filter(x => x.probability >= 0.99 && (x.closeDate ?? '').startsWith(String(y)))
    .reduce((s, x) => s + x.value, 0);
  const thisYear = won(curY);
  const lastYear = won(curY - 1);
  return { thisYear, lastYear, delta: thisYear - lastYear };
}

// ─── Delta cell ───────────────────────────────────────────────────────────────

function DeltaCell({ delta, base, placeholder }: { delta?: number; base?: number; placeholder?: boolean }) {
  if (placeholder) {
    return <span className="text-gray-300 text-xs italic select-none">— coming soon</span>;
  }
  if (delta === undefined || delta === null) return <span className="text-gray-300">—</span>;
  if (delta === 0 && (base === 0 || base === undefined)) return <span className="text-gray-400">—</span>;

  const color = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-gray-400';
  const pct   = base && base !== 0 ? (delta / base) * 100 : null;

  return (
    <div className={`${color} font-medium tabular-nums`}>
      <div className="text-sm">{delta > 0 ? '+' : ''}{fmtK(delta)}</div>
      {pct !== null && (
        <div className="text-xs opacity-70">{fmtPct(pct)}</div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SummaryPageProps {
  thisWeek:    Deal[];  // date-filtered
  lastWeek:    Deal[];  // date-filtered
  allThisWeek: Deal[];  // unfiltered — used for YoY
  onAreaClick: (area: AreaKey) => void;
}

export default function SummaryPage({ thisWeek, lastWeek, allThisWeek, onAreaClick }: SummaryPageProps) {
  const grandTW  = getMetrics(thisWeek);
  const grandLW  = getMetrics(lastWeek);
  const grandYoY = getYoY(allThisWeek);
  const grandWoW = grandTW.total - grandLW.total;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white">
              <th className="px-5 py-3.5 text-left font-semibold text-xs uppercase tracking-wide">Area</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">Closed Won</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">Commit</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">Best Case</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">WoW</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">YoY</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide opacity-50">vs M</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {AREAS.map((area, i) => {
              const tw  = getMetrics(thisWeek.filter(d => d.area === area.key));
              const lw  = getMetrics(lastWeek.filter(d => d.area === area.key));
              const yoy = getYoY(allThisWeek, area.key);
              const wow = tw.total - lw.total;

              return (
                <tr
                  key={area.key}
                  onClick={() => onAreaClick(area.key)}
                  className={`cursor-pointer hover:bg-blue-50/30 transition-colors ${i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}
                >
                  {/* Area */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: area.accentColor }} />
                      <span className="font-semibold text-slate-800">{area.label}</span>
                    </div>
                  </td>

                  {/* Closed Won */}
                  <td className="px-5 py-4 text-right">
                    <span className={`font-bold ${tw.closedWon > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                      {tw.closedWon > 0 ? fmt(tw.closedWon) : '—'}
                    </span>
                  </td>

                  {/* Commit */}
                  <td className="px-5 py-4 text-right">
                    <span className={`font-medium ${tw.commit > 0 ? 'text-slate-700' : 'text-gray-300'}`}>
                      {tw.commit > 0 ? fmt(tw.commit) : '—'}
                    </span>
                  </td>

                  {/* Best Case */}
                  <td className="px-5 py-4 text-right">
                    <span className={`${tw.bestCase > 0 ? 'text-blue-700' : 'text-gray-300'}`}>
                      {tw.bestCase > 0 ? fmt(tw.bestCase) : '—'}
                    </span>
                  </td>

                  {/* WoW */}
                  <td className="px-5 py-4 text-right">
                    <DeltaCell delta={wow} base={lw.total} />
                  </td>

                  {/* YoY */}
                  <td className="px-5 py-4 text-right">
                    {yoy.lastYear > 0
                      ? <DeltaCell delta={yoy.delta} base={yoy.lastYear} />
                      : <span className="text-gray-300 text-xs">no prior data</span>
                    }
                  </td>

                  {/* vs M — placeholder */}
                  <td className="px-5 py-4 text-right">
                    <DeltaCell placeholder />
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-slate-800">
              <td className="px-5 py-4 text-sm">Total</td>

              <td className="px-5 py-4 text-right">
                <span className={`font-bold ${grandTW.closedWon > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                  {grandTW.closedWon > 0 ? fmt(grandTW.closedWon) : '—'}
                </span>
              </td>

              <td className="px-5 py-4 text-right">
                {grandTW.commit > 0 ? fmt(grandTW.commit) : '—'}
              </td>

              <td className="px-5 py-4 text-right text-blue-700">
                {grandTW.bestCase > 0 ? fmt(grandTW.bestCase) : '—'}
              </td>

              <td className="px-5 py-4 text-right">
                <DeltaCell delta={grandWoW} base={grandLW.total} />
              </td>

              <td className="px-5 py-4 text-right">
                {grandYoY.lastYear > 0
                  ? <DeltaCell delta={grandYoY.delta} base={grandYoY.lastYear} />
                  : <span className="text-gray-300 text-xs">no prior data</span>
                }
              </td>

              <td className="px-5 py-4 text-right">
                <DeltaCell placeholder />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
