'use client';

import { Deal } from '@/lib/types';

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

interface WoWViewProps {
  thisWeek: Deal[];
  lastWeek: Deal[];
  accentColor: string;
}

export default function WoWView({ thisWeek, lastWeek }: WoWViewProps) {
  const twIds = new Set(thisWeek.map(d => d.id));
  const lwIds = new Set(lastWeek.map(d => d.id));

  const newDeals     = thisWeek.filter(d => !lwIds.has(d.id));
  const removedDeals = lastWeek.filter(d => !twIds.has(d.id));

  const changedDeals = thisWeek
    .filter(d => {
      const prev = lastWeek.find(ld => ld.id === d.id);
      return prev && (prev.value !== d.value || prev.stage !== d.stage || prev.forecastCategory !== d.forecastCategory);
    })
    .map(d => ({ current: d, previous: lastWeek.find(ld => ld.id === d.id)! }));

  const newARR      = newDeals.reduce((s, d) => s + d.value, 0);
  const removedARR  = removedDeals.reduce((s, d) => s + d.value, 0);
  const changedDelta = changedDeals.reduce((s, { current, previous }) => s + (current.value - previous.value), 0);
  const net         = newARR - removedARR + changedDelta;

  return (
    <div>
      {/* Net summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Net Movement',   value: (net >= 0 ? '+' : '') + fmt(net),       color: net >= 0 ? 'text-emerald-600' : 'text-red-500',         border: 'border-gray-200'   },
          { label: 'Added',          value: '+' + fmt(newARR),                       color: 'text-emerald-600',                                       border: 'border-emerald-200' },
          { label: 'Removed',        value: '-' + fmt(removedARR),                  color: 'text-red-500',                                           border: 'border-red-200'     },
          { label: 'Value Changes',  value: (changedDelta >= 0 ? '+' : '') + fmt(changedDelta), color: changedDelta >= 0 ? 'text-emerald-600' : 'text-red-500', border: 'border-blue-200' },
        ].map(m => (
          <div key={m.label} className={`bg-white rounded-xl border p-4 ${m.border}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {/* New deals */}
        <Section title={`New Deals (${newDeals.length})`} color="emerald" empty="No new deals this week">
          {newDeals.length > 0 && (
            <DealTable deals={newDeals} valuePrefix="+" valueColor="text-emerald-700" />
          )}
        </Section>

        {/* Removed deals */}
        <Section title={`Removed (${removedDeals.length})`} color="red" empty="No deals removed">
          {removedDeals.length > 0 && (
            <DealTable deals={removedDeals} valuePrefix="-" valueColor="text-red-600" />
          )}
        </Section>

        {/* Changed deals */}
        <Section title={`Changes (${changedDeals.length})`} color="blue" empty="No changes this week">
          {changedDeals.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Stage</th>
                    <th className="px-5 py-3">Forecast</th>
                    <th className="px-5 py-3 text-right">ARR Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {changedDeals.map(({ current, previous }) => {
                    const delta = current.value - previous.value;
                    return (
                      <tr key={current.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{current.company}</td>
                        <td className="px-5 py-3 text-gray-600">{current.owner}</td>
                        <td className="px-5 py-3">
                          {previous.stage !== current.stage ? (
                            <span className="text-xs">
                              <span className="text-gray-400 line-through">{previous.stage}</span>
                              <span className="mx-1 text-gray-400">→</span>
                              <span className="text-slate-700 font-medium">{current.stage}</span>
                            </span>
                          ) : <span className="text-gray-600">{current.stage}</span>}
                        </td>
                        <td className="px-5 py-3">
                          {previous.forecastCategory !== current.forecastCategory ? (
                            <span className="text-xs">
                              <span className="text-gray-400 line-through">{previous.forecastCategory}</span>
                              <span className="mx-1 text-gray-400">→</span>
                              <span className="text-slate-700 font-medium">{current.forecastCategory}</span>
                            </span>
                          ) : <span className="text-gray-600">{current.forecastCategory}</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {delta !== 0 ? (
                            <span className={`font-semibold ${delta > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {delta > 0 ? '+' : ''}{fmt(delta)}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title, color, empty, children,
}: {
  title: string;
  color: 'emerald' | 'red' | 'blue';
  empty: string;
  children?: React.ReactNode;
}) {
  const headerMap = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800 bg-emerald-500',
    red:     'bg-red-50 border-red-100 text-red-800 bg-red-500',
    blue:    'bg-blue-50 border-blue-100 text-blue-800 bg-blue-500',
  };
  const [bg, border, text, dot] = headerMap[color].split(' ');

  return (
    <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={`px-5 py-4 ${bg} border-b ${border} flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className={`font-semibold ${text}`}>{title}</h3>
      </div>
      {children ?? <p className="px-5 py-4 text-sm text-gray-400">{empty}</p>}
    </section>
  );
}

function DealTable({
  deals, valuePrefix, valueColor,
}: {
  deals: Deal[];
  valuePrefix: string;
  valueColor: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-5 py-3">Company</th>
            <th className="px-5 py-3">Owner</th>
            <th className="px-5 py-3">Stage</th>
            <th className="px-5 py-3">Forecast</th>
            <th className="px-5 py-3 text-right">ARR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deals.map(d => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 font-medium text-slate-800">{d.company}</td>
              <td className="px-5 py-3 text-gray-600">{d.owner}</td>
              <td className="px-5 py-3 text-gray-600">{d.stage}</td>
              <td className="px-5 py-3 text-gray-600">{d.forecastCategory}</td>
              <td className={`px-5 py-3 text-right font-semibold ${valueColor}`}>
                {valuePrefix}{fmt(d.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
