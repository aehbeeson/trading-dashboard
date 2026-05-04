'use client';

import { useState } from 'react';
import { Deal, ForecastCategory } from '@/lib/types';

const FORECAST_BADGE: Record<ForecastCategory, string> = {
  'Commit':    'bg-emerald-100 text-emerald-800',
  'Best Case': 'bg-blue-100 text-blue-800',
  'Pipeline':  'bg-gray-100 text-gray-700',
  'Omitted':   'bg-red-100 text-red-700',
};

const FC_ORDER: Record<string, number> = {
  'Commit': 4, 'Best Case': 3, 'Pipeline': 2, 'Omitted': 1,
};

function fmt(v: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function fmtDate(str: string) {
  if (!str) return '-';
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function pct(p: number) {
  return Math.round(p * 100) + '%';
}

type SortKey = 'amount' | 'date-asc' | 'date-desc' | 'forecast' | 'forecast-amount';

function sortDeals(deals: Deal[], key: SortKey): Deal[] {
  const copy = [...deals];
  switch (key) {
    case 'amount':         return copy.sort((a, b) => b.value - a.value);
    case 'date-asc':       return copy.sort((a, b) => (a.closeDate ?? '').localeCompare(b.closeDate ?? ''));
    case 'date-desc':      return copy.sort((a, b) => (b.closeDate ?? '').localeCompare(a.closeDate ?? ''));
    case 'forecast':       return copy.sort((a, b) => (FC_ORDER[b.forecastCategory] ?? 0) - (FC_ORDER[a.forecastCategory] ?? 0));
    case 'forecast-amount':return copy.sort((a, b) => {
      const fc = (FC_ORDER[b.forecastCategory] ?? 0) - (FC_ORDER[a.forecastCategory] ?? 0);
      return fc !== 0 ? fc : b.value - a.value;
    });
  }
}

interface ResultsViewProps {
  deals: Deal[];
  accentColor: string;
}

interface SectionProps {
  title:       string;
  deals:       Deal[];
  headerBg:    string;
  headerText:  string;
  defaultOpen: boolean;
  sortKey:     SortKey;
}

function Section({ title, deals, headerBg, headerText, defaultOpen, sortKey }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const sorted = sortDeals(deals, sortKey);

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className={`cursor-pointer select-none ${headerBg}`}
      >
        <td colSpan={6} className="px-5 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`font-semibold text-sm ${headerText}`}>{title}</span>
              <span className={`text-xs opacity-60 ${headerText}`}>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
            </div>
            <span className={`text-xs opacity-50 ${headerText}`}>{open ? '▴' : '▾'}</span>
          </div>
        </td>
      </tr>

      {open && (
        sorted.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-5 py-3 text-sm text-gray-400 italic">No deals in this group.</td>
          </tr>
        ) : (
          sorted.map((deal, i) => (
            <tr key={deal.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
              <td className="px-5 py-2.5 font-medium text-slate-800 truncate max-w-0" title={deal.company}>{deal.company}</td>
              <td className="px-5 py-2.5 text-right text-gray-600">{deal.owner}</td>
              <td className="px-5 py-2.5 text-right">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${FORECAST_BADGE[deal.forecastCategory]}`}>
                  {deal.forecastCategory}
                </span>
              </td>
              <td className="px-5 py-2.5 text-right text-gray-500">{pct(deal.probability)}</td>
              <td className="px-5 py-2.5 text-right font-semibold text-slate-800">{fmt(deal.value)}</td>
              <td className="px-5 py-2.5 text-right text-gray-500">{fmtDate(deal.closeDate)}</td>
            </tr>
          ))
        )
      )}

      <tr><td colSpan={6} className="h-2 bg-gray-100" /></tr>
    </>
  );
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'amount',          label: 'Amount'                    },
  { key: 'date-asc',        label: 'Close Date (Nearest)'      },
  { key: 'date-desc',       label: 'Close Date (Furthest)'     },
  { key: 'forecast',        label: 'Forecast Category'         },
  { key: 'forecast-amount', label: 'Forecast Category + Amount'},
];

export default function ResultsView({ deals }: ResultsViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('amount');

  const won        = deals.filter(d => d.probability >= 0.99);
  const inProgress = deals.filter(d => d.probability > 0.01 && d.probability < 0.99);
  const lost       = deals.filter(d => d.probability <= 0.01);

  const wonARR  = won.reduce((s, d) => s + d.value, 0);
  const inpARR  = inProgress.reduce((s, d) => s + d.value, 0);
  const lostARR = lost.reduce((s, d) => s + d.value, 0);

  const metrics = [
    { label: 'Closed Won',  value: fmt(wonARR),          color: 'text-emerald-600' },
    { label: 'In Progress', value: fmt(inpARR),           color: 'text-blue-600'    },
    { label: 'Closed Lost', value: fmt(lostARR),          color: 'text-red-500'     },
    { label: 'Total Deals', value: String(deals.length),  color: 'text-slate-900'   },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Sort control */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide shrink-0">Order by</span>
        <div className="flex gap-1 flex-wrap">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.key}
              onClick={() => setSortKey(o.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortKey === o.key
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col />
              <col style={{ width: '150px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '150px' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-semibold">Company</th>
                <th className="px-5 py-2.5 text-right font-semibold">Owner</th>
                <th className="px-5 py-2.5 text-right font-semibold">Forecast</th>
                <th className="px-5 py-2.5 text-right font-semibold">Probability</th>
                <th className="px-5 py-2.5 text-right font-semibold">ARR</th>
                <th className="px-5 py-2.5 text-right font-semibold">Close Date</th>
              </tr>
            </thead>
            <tbody>
              <Section title="Closed Won"   deals={won}        headerBg="bg-emerald-50 hover:bg-emerald-100" headerText="text-emerald-800" defaultOpen={true}  sortKey={sortKey} />
              <Section title="In Progress"  deals={inProgress} headerBg="bg-blue-50 hover:bg-blue-100"       headerText="text-blue-800"    defaultOpen={false} sortKey={sortKey} />
              <Section title="Closed Lost"  deals={lost}       headerBg="bg-red-50 hover:bg-red-100"         headerText="text-red-700"     defaultOpen={false} sortKey={sortKey} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
