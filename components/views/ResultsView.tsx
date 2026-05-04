'use client';

import { useState } from 'react';
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

function fmtDate(str: string) {
  if (!str) return '-';
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? str : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function pct(p: number) {
  return Math.round(p * 100) + '%';
}

interface ResultsViewProps {
  deals: Deal[];
  accentColor: string;
}

function DealTable({ deals }: { deals: Deal[] }) {
  const sorted = [...deals].sort((a, b) => b.value - a.value);
  const total  = deals.reduce((s, d) => s + d.value, 0);
  if (deals.length === 0) return <p className="px-5 py-4 text-sm text-gray-400">No deals in this group.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <th className="px-5 py-2.5">Company</th>
            <th className="px-5 py-2.5">Owner</th>
            <th className="px-5 py-2.5">Stage</th>
            <th className="px-5 py-2.5">Forecast</th>
            <th className="px-5 py-2.5 text-right">Probability</th>
            <th className="px-5 py-2.5 text-right">ARR</th>
            <th className="px-5 py-2.5">Close Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map(deal => (
            <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-2.5 font-medium text-slate-800">{deal.company}</td>
              <td className="px-5 py-2.5 text-gray-600">{deal.owner}</td>
              <td className="px-5 py-2.5 text-gray-600">{deal.stage}</td>
              <td className="px-5 py-2.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${FORECAST_BADGE[deal.forecastCategory]}`}>
                  {deal.forecastCategory}
                </span>
              </td>
              <td className="px-5 py-2.5 text-right text-gray-500">{pct(deal.probability)}</td>
              <td className="px-5 py-2.5 text-right font-semibold text-slate-800">{fmt(deal.value)}</td>
              <td className="px-5 py-2.5 text-gray-500">{fmtDate(deal.closeDate)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-slate-800 border-t border-gray-200">
            <td className="px-5 py-2.5" colSpan={5}>Total</td>
            <td className="px-5 py-2.5 text-right">{fmt(total)}</td>
            <td className="px-5 py-2.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

interface GroupProps {
  title: string;
  deals: Deal[];
  totalARR: number;
  headerClass: string;
  defaultOpen: boolean;
}

function DealGroup({ title, deals, totalARR, headerClass, defaultOpen }: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left ${headerClass}`}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{title}</span>
          <span className="text-xs opacity-75">{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm">{fmt(totalARR)}</span>
          <span className="text-xs opacity-60">{open ? '▴' : '▾'}</span>
        </div>
      </button>
      {open && <DealTable deals={deals} />}
    </div>
  );
}

export default function ResultsView({ deals }: ResultsViewProps) {
  const won        = deals.filter(d => d.probability >= 0.99);
  const inProgress = deals.filter(d => d.probability > 0.01 && d.probability < 0.99);
  const lost       = deals.filter(d => d.probability <= 0.01);

  const wonARR  = won.reduce((s, d) => s + d.value, 0);
  const inpARR  = inProgress.reduce((s, d) => s + d.value, 0);
  const lostARR = lost.reduce((s, d) => s + d.value, 0);

  const metrics = [
    { label: 'Closed Won',  value: fmt(wonARR),       color: 'text-emerald-600' },
    { label: 'In Progress', value: fmt(inpARR),        color: 'text-blue-600'    },
    { label: 'Closed Lost', value: fmt(lostARR),       color: 'text-red-500'     },
    { label: 'Total Deals', value: String(deals.length), color: 'text-slate-900' },
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

      <div className="space-y-3">
        <DealGroup
          title="Closed Won"
          deals={won}
          totalARR={wonARR}
          headerClass="bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          defaultOpen={true}
        />
        <DealGroup
          title="In Progress"
          deals={inProgress}
          totalARR={inpARR}
          headerClass="bg-blue-50 text-blue-800 hover:bg-blue-100"
          defaultOpen={false}
        />
        <DealGroup
          title="Closed Lost"
          deals={lost}
          totalARR={lostARR}
          headerClass="bg-red-50 text-red-700 hover:bg-red-100"
          defaultOpen={false}
        />
      </div>
    </div>
  );
}
