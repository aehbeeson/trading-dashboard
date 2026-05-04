'use client';

import { Deal, AreaKey, AREAS } from '@/lib/types';

function fmt(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtDelta(value: number): string {
  return (value >= 0 ? '+' : '') + fmt(value);
}

function getMetrics(deals: Deal[], area?: AreaKey) {
  const d = area ? deals.filter(x => x.area === area) : deals;
  return {
    totalARR:   d.reduce((s, x) => s + x.value, 0),
    dealCount:  d.length,
    commitARR:  d.filter(x => x.forecastCategory === 'Commit').reduce((s, x) => s + x.value, 0),
    bestCase:   d.filter(x => x.forecastCategory === 'Best Case').reduce((s, x) => s + x.value, 0),
  };
}

interface SummaryPageProps {
  thisWeek: Deal[];
  lastWeek: Deal[];
  onAreaClick: (area: AreaKey) => void;
}

export default function SummaryPage({ thisWeek, lastWeek, onAreaClick }: SummaryPageProps) {
  const tw = getMetrics(thisWeek);
  const lw = getMetrics(lastWeek);
  const wowDelta = tw.totalARR - lw.totalARR;
  const wowPct = lw.totalARR > 0 ? ((wowDelta / lw.totalARR) * 100).toFixed(1) : '0.0';

  return (
    <div>
      {/* Top summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Pipeline ARR</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{fmt(tw.totalARR)}</p>
          <p className="text-sm text-gray-400 mt-1">{tw.dealCount} deals across all areas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Commit</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{fmt(tw.commitARR)}</p>
          <p className="text-sm text-gray-400 mt-1">Best Case: {fmt(tw.bestCase)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">WoW Movement</p>
          <p className={`text-3xl font-bold mt-1 ${wowDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {fmtDelta(wowDelta)}
          </p>
          <p className="text-sm text-gray-400 mt-1">{wowDelta >= 0 ? '+' : ''}{wowPct}% vs last week</p>
        </div>
      </div>

      {/* Area cards */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">Areas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AREAS.map(area => {
          const tw = getMetrics(thisWeek, area.key);
          const lw = getMetrics(lastWeek, area.key);
          const delta = tw.totalARR - lw.totalARR;

          return (
            <button
              key={area.key}
              onClick={() => onAreaClick(area.key)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: area.accentColor }}
                  />
                  <h3 className="font-semibold text-slate-800">{area.label}</h3>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-slate-600 transition-colors">
                  View details →
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total ARR</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(tw.totalARR)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Commit</p>
                  <p className="text-lg font-bold text-slate-900">{fmt(tw.commitARR)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">WoW</p>
                  <p className={`text-lg font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fmtDelta(delta)}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                <span>{tw.dealCount} deals</span>
                <span>Best Case: {fmt(tw.bestCase)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
