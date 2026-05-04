'use client';

import { Deal } from '@/lib/types';

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

interface ForecastViewProps {
  deals: Deal[];
  accentColor: string;
}

export default function ForecastView({ deals }: ForecastViewProps) {
  const byOwner = deals.reduce<Record<string, Deal[]>>((acc, d) => {
    (acc[d.owner] ??= []).push(d);
    return acc;
  }, {});

  const rows = Object.entries(byOwner).map(([owner, ownerDeals]) => ({
    owner,
    deals:    ownerDeals,
    commit:   ownerDeals.filter(d => d.forecastCategory === 'Commit').reduce((s, d) => s + d.value, 0),
    bestCase: ownerDeals.filter(d => d.forecastCategory === 'Best Case').reduce((s, d) => s + d.value, 0),
    pipeline: ownerDeals.filter(d => d.forecastCategory === 'Pipeline').reduce((s, d) => s + d.value, 0),
    total:    ownerDeals.reduce((s, d) => s + d.value, 0),
  })).sort((a, b) => b.total - a.total);

  const grand = {
    commit:   deals.filter(d => d.forecastCategory === 'Commit').reduce((s, d) => s + d.value, 0),
    bestCase: deals.filter(d => d.forecastCategory === 'Best Case').reduce((s, d) => s + d.value, 0),
    pipeline: deals.filter(d => d.forecastCategory === 'Pipeline').reduce((s, d) => s + d.value, 0),
    total:    deals.reduce((s, d) => s + d.value, 0),
  };

  return (
    <div>
      {/* Category summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Commit',    value: grand.commit,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Best Case', value: grand.bestCase,  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200'       },
          { label: 'Pipeline',  value: grand.pipeline,  color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200'       },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{fmt(item.value)}</p>
          </div>
        ))}
      </div>

      {/* SD summary table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-800">Sales Director Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Sales Director</th>
                <th className="px-5 py-3 text-right">Commit</th>
                <th className="px-5 py-3 text-right">Best Case</th>
                <th className="px-5 py-3 text-right">Pipeline</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">Deals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(row => (
                <tr key={row.owner} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{row.owner}</td>
                  <td className="px-5 py-3 text-right font-medium text-emerald-700">{fmt(row.commit)}</td>
                  <td className="px-5 py-3 text-right text-blue-700">{fmt(row.bestCase)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{fmt(row.pipeline)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(row.total)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{row.deals.length}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-slate-800 border-t border-gray-200">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right text-emerald-700">{fmt(grand.commit)}</td>
                <td className="px-5 py-3 text-right text-blue-700">{fmt(grand.bestCase)}</td>
                <td className="px-5 py-3 text-right text-gray-600">{fmt(grand.pipeline)}</td>
                <td className="px-5 py-3 text-right">{fmt(grand.total)}</td>
                <td className="px-5 py-3 text-right">{deals.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Per-SD deal breakdown (collapsible) */}
      <div className="space-y-3">
        {rows.map(row => (
          <details key={row.owner} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <summary className="px-5 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-gray-50 list-none flex items-center justify-between">
              <span>{row.owner} — {row.deals.length} deal{row.deals.length !== 1 ? 's' : ''}</span>
              <span className="text-gray-400 text-xs">expand ▾</span>
            </summary>
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full text-sm bg-gray-50">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-8 py-2">Company</th>
                    <th className="px-5 py-2">Stage</th>
                    <th className="px-5 py-2">Forecast</th>
                    <th className="px-5 py-2 text-right">ARR</th>
                    <th className="px-5 py-2">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {row.deals.sort((a, b) => b.value - a.value).map(deal => (
                    <tr key={deal.id} className="hover:bg-white transition-colors">
                      <td className="px-8 py-2 text-slate-700 font-medium">{deal.company}</td>
                      <td className="px-5 py-2 text-gray-600">{deal.stage}</td>
                      <td className="px-5 py-2 text-gray-600">{deal.forecastCategory}</td>
                      <td className="px-5 py-2 text-right font-semibold text-slate-800">{fmt(deal.value)}</td>
                      <td className="px-5 py-2 text-gray-500">
                        {new Date(deal.closeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
