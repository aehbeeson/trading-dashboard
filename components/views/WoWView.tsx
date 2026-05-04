'use client';

import { useState } from 'react';
import { Deal } from '@/lib/types';

const FC_ORDER: Record<string, number> = {
  'Omitted': 0, 'Pipeline': 1, 'Best Case': 2, 'Commit': 3,
};

function fmtK(v: number): string {
  return '£' + Math.round(v / 1000) + 'k';
}

function fmtDelta(delta: number): string {
  if (delta === 0) return '-';
  const abs = fmtK(Math.abs(delta));
  return delta < 0 ? `(${abs})` : `+${abs}`;
}

function fmtDate(str: string): string {
  if (!str) return '-';
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function fmt(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}

interface WoWViewProps {
  thisWeek: Deal[];
  lastWeek: Deal[];   // date-filtered, for net movement calcs
  allLastWeek: Deal[]; // not date-filtered, for per-deal lookups
  accentColor: string;
}

function hasChanged(deal: Deal, prev: Deal | undefined): boolean {
  if (!prev) return true;
  return prev.closeDate !== deal.closeDate
    || prev.forecastCategory !== deal.forecastCategory
    || prev.value !== deal.value;
}

export default function WoWView({ thisWeek, lastWeek, allLastWeek }: WoWViewProps) {
  const [showAll, setShowAll] = useState(false);

  const lwMap  = new Map(allLastWeek.map(d => [d.id, d]));
  const twIds  = new Set(thisWeek.map(d => d.id));

  // Net movement using date-filtered lastWeek
  const removedDeals  = lastWeek.filter(d => !twIds.has(d.id));
  const newDeals      = thisWeek.filter(d => !lwMap.has(d.id));
  const newARR        = newDeals.reduce((s, d) => s + d.value, 0);
  const removedARR    = removedDeals.reduce((s, d) => s + d.value, 0);
  const changedDelta  = thisWeek
    .filter(d => lwMap.has(d.id))
    .reduce((s, d) => s + (d.value - lwMap.get(d.id)!.value), 0);
  const net = newARR - removedARR + changedDelta;

  const sorted   = [...thisWeek].sort((a, b) => a.closeDate.localeCompare(b.closeDate));
  const changed  = sorted.filter(d => hasChanged(d, lwMap.get(d.id)));
  const visible  = showAll ? sorted : changed;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Net Movement',  value: (net >= 0 ? '+' : '') + fmt(net),              color: net >= 0 ? 'text-emerald-600' : 'text-red-500',              border: 'border-gray-200'    },
          { label: 'Added',         value: '+' + fmt(newARR),                              color: 'text-emerald-600',                                            border: 'border-emerald-200' },
          { label: 'Removed',       value: '-' + fmt(removedARR),                         color: 'text-red-500',                                                border: 'border-red-200'     },
          { label: 'Value Changes', value: (changedDelta >= 0 ? '+' : '') + fmt(changedDelta), color: changedDelta >= 0 ? 'text-emerald-600' : 'text-red-500', border: 'border-blue-200'    },
        ].map(m => (
          <div key={m.label} className={`bg-white rounded-xl border p-4 ${m.border}`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Detail table */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {showAll
            ? `Showing all ${sorted.length} deals`
            : `Showing ${changed.length} deal${changed.length !== 1 ? 's' : ''} with changes`}
        </p>
        <button
          onClick={() => setShowAll(v => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAll ? `Changes only (${changed.length})` : `Show all (${sorted.length})`}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-white" style={{ backgroundColor: '#1e3a5f' }}>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Close Date<br /><span className="font-normal opacity-70">(Last Week)</span></th>
                <th className="px-4 py-3 font-semibold">Close Date</th>
                <th className="px-4 py-3 font-semibold">Forecast Category<br /><span className="font-normal opacity-70">(Last Week)</span></th>
                <th className="px-4 py-3 font-semibold">Forecast Category</th>
                <th className="px-4 py-3 font-semibold text-right">Deal Value<br /><span className="font-normal opacity-70">(Last Week)</span></th>
                <th className="px-4 py-3 font-semibold text-right">Deal Value</th>
                <th className="px-4 py-3 font-semibold text-right">Change in<br />Deal Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((deal, i) => {
                const prev   = lwMap.get(deal.id);
                const isNew  = !prev;
                const rowBg  = i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60';

                const dateChanged  = prev && prev.closeDate !== deal.closeDate;
                const dateLater    = dateChanged && deal.closeDate > prev!.closeDate;
                const dateEarlier  = dateChanged && deal.closeDate < prev!.closeDate;

                const fcChanged    = prev && prev.forecastCategory !== deal.forecastCategory;
                const fcImproved   = fcChanged && (FC_ORDER[deal.forecastCategory] ?? 0) > (FC_ORDER[prev!.forecastCategory] ?? 0);
                const fcDowngraded = fcChanged && (FC_ORDER[deal.forecastCategory] ?? 0) < (FC_ORDER[prev!.forecastCategory] ?? 0);

                const delta = isNew ? deal.value : deal.value - prev!.value;

                return (
                  <tr key={deal.id} className={rowBg}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{deal.company}</td>

                    {/* Close date last week */}
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {isNew ? <span className="text-emerald-600 font-medium">New</span> : fmtDate(prev!.closeDate)}
                    </td>

                    {/* Close date current — highlight if changed */}
                    <td className={`px-4 py-2.5 text-xs font-medium rounded-sm ${
                      dateLater   ? 'bg-red-100 text-red-700'   :
                      dateEarlier ? 'bg-green-100 text-green-700' :
                      'text-gray-700'
                    }`}>
                      {fmtDate(deal.closeDate)}
                    </td>

                    {/* Forecast last week */}
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {isNew ? '-' : prev!.forecastCategory}
                    </td>

                    {/* Forecast current — highlight if changed */}
                    <td className={`px-4 py-2.5 text-xs font-medium ${
                      fcImproved   ? 'bg-green-100 text-green-700' :
                      fcDowngraded ? 'bg-red-100 text-red-700'     :
                      'text-gray-700'
                    }`}>
                      {deal.forecastCategory}
                    </td>

                    {/* Deal value last week */}
                    <td className="px-4 py-2.5 text-right text-gray-500 text-xs">
                      {isNew ? '-' : fmtK(prev!.value)}
                    </td>

                    {/* Deal value current */}
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                      {fmtK(deal.value)}
                    </td>

                    {/* Change in deal value */}
                    <td className={`px-4 py-2.5 text-right font-medium ${
                      delta < 0 ? 'bg-red-100 text-red-700' :
                      delta > 0 && !isNew ? 'bg-green-100 text-green-700' :
                      isNew ? 'text-emerald-600' :
                      'text-gray-400'
                    }`}>
                      {isNew ? fmtK(deal.value) : fmtDelta(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
