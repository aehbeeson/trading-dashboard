'use client';

import { Deal, AreaKey, AREAS } from '@/lib/types';

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

function fmtDelta(v: number) {
  return (v >= 0 ? '+' : '') + fmt(v);
}

function getMetrics(deals: Deal[], area?: AreaKey) {
  const d = area ? deals.filter(x => x.area === area) : deals;
  return {
    totalARR:  d.reduce((s, x) => s + x.value, 0),
    dealCount: d.length,
    commitARR: d.filter(x => x.forecastCategory === 'Commit').reduce((s, x) => s + x.value, 0),
    bestCase:  d.filter(x => x.forecastCategory === 'Best Case').reduce((s, x) => s + x.value, 0),
  };
}

interface SummaryPageProps {
  thisWeek: Deal[];
  lastWeek: Deal[];
  onAreaClick: (area: AreaKey) => void;
}

export default function SummaryPage({ thisWeek, lastWeek, onAreaClick }: SummaryPageProps) {
  const totals    = getMetrics(thisWeek);
  const totalsLw  = getMetrics(lastWeek);
  const totalsDelta = totals.totalARR - totalsLw.totalARR;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <th className="px-5 py-3">Area</th>
            <th className="px-5 py-3 text-right">Total ARR</th>
            <th className="px-5 py-3 text-right">Commit</th>
            <th className="px-5 py-3 text-right">Best Case</th>
            <th className="px-5 py-3 text-right">WoW</th>
            <th className="px-5 py-3 text-right">Deals</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {AREAS.map(area => {
            const tw    = getMetrics(thisWeek, area.key);
            const lw    = getMetrics(lastWeek, area.key);
            const delta = tw.totalARR - lw.totalARR;

            return (
              <tr
                key={area.key}
                onClick={() => onAreaClick(area.key)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4 font-medium text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: area.accentColor }} />
                    {area.label}
                  </div>
                </td>
                <td className="px-5 py-4 text-right font-semibold text-slate-900">{fmt(tw.totalARR)}</td>
                <td className="px-5 py-4 text-right text-emerald-700 font-medium">{fmt(tw.commitARR)}</td>
                <td className="px-5 py-4 text-right text-blue-700">{fmt(tw.bestCase)}</td>
                <td className={`px-5 py-4 text-right font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtDelta(delta)}
                </td>
                <td className="px-5 py-4 text-right text-gray-500">{tw.dealCount}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-slate-800">
            <td className="px-5 py-4">Total</td>
            <td className="px-5 py-4 text-right">{fmt(totals.totalARR)}</td>
            <td className="px-5 py-4 text-right text-emerald-700">{fmt(totals.commitARR)}</td>
            <td className="px-5 py-4 text-right text-blue-700">{fmt(totals.bestCase)}</td>
            <td className={`px-5 py-4 text-right ${totalsDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmtDelta(totalsDelta)}
            </td>
            <td className="px-5 py-4 text-right text-gray-500">{totals.dealCount}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
