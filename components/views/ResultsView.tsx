'use client';

import { Deal, ForecastCategory } from '@/lib/types';

const FORECAST_BADGE: Record<ForecastCategory, string> = {
  'Commit':    'bg-emerald-100 text-emerald-800',
  'Best Case': 'bg-blue-100 text-blue-800',
  'Pipeline':  'bg-gray-100 text-gray-700',
  'Omitted':   'bg-red-100 text-red-700',
};

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

interface ResultsViewProps {
  deals: Deal[];
  accentColor: string;
}

export default function ResultsView({ deals }: ResultsViewProps) {
  const sorted     = [...deals].sort((a, b) => b.value - a.value);
  const totalARR   = deals.reduce((s, d) => s + d.value, 0);
  const commitARR  = deals.filter(d => d.forecastCategory === 'Commit').reduce((s, d) => s + d.value, 0);
  const bestCase   = deals.filter(d => d.forecastCategory === 'Best Case').reduce((s, d) => s + d.value, 0);

  const metrics = [
    { label: 'Total ARR',  value: fmt(totalARR)  },
    { label: 'Commit',     value: fmt(commitARR)  },
    { label: 'Best Case',  value: fmt(bestCase)   },
    { label: 'Deals',      value: String(deals.length) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-800">All Deals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Forecast</th>
                <th className="px-5 py-3 text-right">ARR</th>
                <th className="px-5 py-3">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(deal => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{deal.company}</td>
                  <td className="px-5 py-3 text-gray-600">{deal.owner}</td>
                  <td className="px-5 py-3 text-gray-600">{deal.stage}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${FORECAST_BADGE[deal.forecastCategory]}`}>
                      {deal.forecastCategory}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(deal.value)}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(deal.closeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold text-slate-800 border-t border-gray-200">
                <td className="px-5 py-3" colSpan={4}>Total</td>
                <td className="px-5 py-3 text-right">{fmt(totalARR)}</td>
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
