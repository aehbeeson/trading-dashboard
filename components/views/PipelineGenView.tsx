'use client';

import { useState, useEffect } from 'react';
import { PipelineGenDeal } from '@/lib/types';

// ─── Source type mapping ──────────────────────────────────────────────────────

const CATEGORIES = ['Events', 'Inbound Paid', 'Inbound Other', 'Outbound'] as const;
type Category = typeof CATEGORIES[number];

const SOURCE_MAP: Record<string, Category> = {
  'Events':         'Events',
  'Inbound - Paid': 'Inbound Paid',
  'Inbound - Other':'Inbound Other',
  'Outbound':       'Outbound',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtK(v: number) {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  return (v < 0 ? '-' : '') + '£' + (abs >= 1_000_000 ? (abs / 1_000_000).toFixed(1) + 'M' : Math.round(abs / 1000) + 'k');
}

function fmtPct(actual: number, target: number) {
  if (!target) return '—';
  return Math.round((actual / target) * 100) + '%';
}

function pctThrough(): number {
  const now  = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round((now.getDate() / days) * 100);
}

function filterMTD(deals: PipelineGenDeal[]): PipelineGenDeal[] {
  const now    = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return deals.filter(d => d.createDate.startsWith(prefix));
}

function sumByCategory(deals: PipelineGenDeal[]): Record<Category, number> {
  const out = Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<Category, number>;
  for (const d of deals) {
    const cat = SOURCE_MAP[d.sourceType];
    if (cat) out[cat] += d.amount;
  }
  return out;
}

// ─── £k input ────────────────────────────────────────────────────────────────

function KInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(value > 0 ? String(Math.round(value / 1000)) : '');
  useEffect(() => { setText(value > 0 ? String(Math.round(value / 1000)) : ''); }, [value]);
  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-gray-400 text-xs select-none">£</span>
      <input
        type="number" min={0} value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          const n = parseFloat(text) || 0;
          onChange(Math.round(n * 1000));
          setText(n > 0 ? String(n) : '');
        }}
        placeholder="—"
        className="w-20 text-right border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-white placeholder-gray-300"
      />
      <span className="text-gray-400 text-xs select-none">k</span>
    </div>
  );
}

// ─── Reach colour ─────────────────────────────────────────────────────────────

function reachColour(actual: number, target: number): string {
  if (!target) return 'text-gray-400';
  const r = actual / target;
  if (r >= 1)    return 'text-emerald-700 font-semibold';
  if (r >= 0.7)  return 'text-amber-600 font-medium';
  return 'text-red-600';
}

// ─── Component ────────────────────────────────────────────────────────────────

type ForecastMap = Record<Category, number>;
const EMPTY_FORECAST: ForecastMap = { Events: 0, 'Inbound Paid': 0, 'Inbound Other': 0, Outbound: 0 };

interface PipelineGenViewProps {
  pipelineGen:         PipelineGenDeal[];
  pipelineGenLastWeek: PipelineGenDeal[];
}

export default function PipelineGenView({ pipelineGen, pipelineGenLastWeek }: PipelineGenViewProps) {
  const [forecast, setForecast] = useState<ForecastMap>(EMPTY_FORECAST);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pipelineGenForecast');
      if (raw) setForecast(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  function updateForecast(cat: Category, value: number) {
    const next = { ...forecast, [cat]: value };
    setForecast(next);
    try { localStorage.setItem('pipelineGenForecast', JSON.stringify(next)); } catch {}
  }

  const mtdDeals = filterMTD(pipelineGen);
  const lwDeals  = filterMTD(pipelineGenLastWeek);

  const mtd     = sumByCategory(mtdDeals);
  const lw      = sumByCategory(lwDeals);
  const through = pctThrough();

  const mtdTotal = CATEGORIES.reduce((s, c) => s + mtd[c], 0);
  const lwTotal  = CATEGORIES.reduce((s, c) => s + lw[c], 0);
  const frcTotal = CATEGORIES.reduce((s, c) => s + forecast[c], 0);

  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  if (!loaded) return null;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            MTD Pipeline Generation Results
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {monthLabel} · New Business · grouped by deal create date &amp; source type
          </p>
        </div>

        {/* % through month badge */}
        <div
          className="flex flex-col items-center justify-center rounded-full w-20 h-20 text-center shadow-sm border-2 border-blue-200 bg-blue-50 shrink-0"
        >
          <span className="text-2xl font-bold text-blue-700 leading-none">{through}%</span>
          <span className="text-[10px] font-medium text-blue-500 leading-tight mt-1 uppercase tracking-tight">
            through<br />the month
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white">
                <th className="px-5 py-3.5 text-left font-semibold text-xs uppercase tracking-wide w-44" />
                {CATEGORIES.map(cat => (
                  <th key={cat} className="px-4 py-3.5 text-right font-semibold text-xs">
                    {cat}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right font-semibold text-xs">Total</th>
              </tr>
            </thead>

            <tbody>
              {/* MTD Results */}
              <tr className="bg-blue-50 border-t border-gray-100">
                <td className="px-5 py-3.5 font-semibold text-slate-700">
                  <span className="underline decoration-blue-400">MTD</span> Results
                </td>
                {CATEGORIES.map(cat => (
                  <td key={cat} className="px-4 py-3.5 text-right font-bold text-blue-800 tabular-nums">
                    {fmtK(mtd[cat])}
                  </td>
                ))}
                <td className="px-4 py-3.5 text-right font-bold text-blue-800 tabular-nums">{fmtK(mtdTotal)}</td>
              </tr>

              {/* Full Month Forecast */}
              <tr className="bg-white border-t border-gray-100">
                <td className="px-5 py-3 font-semibold text-slate-700">
                  Full <span className="underline decoration-gray-400">Month</span> Forecast
                </td>
                {CATEGORIES.map(cat => (
                  <td key={cat} className="px-4 py-2.5 text-right">
                    <KInput value={forecast[cat]} onChange={v => updateForecast(cat, v)} />
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">
                  {fmtK(frcTotal)}
                </td>
              </tr>

              {/* % Reach */}
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-5 py-3.5 font-semibold text-slate-700">% Reach</td>
                {CATEGORIES.map(cat => (
                  <td key={cat} className={`px-4 py-3.5 text-right tabular-nums ${reachColour(mtd[cat], forecast[cat])}`}>
                    {fmtPct(mtd[cat], forecast[cat])}
                  </td>
                ))}
                <td className={`px-4 py-3.5 text-right tabular-nums ${reachColour(mtdTotal, frcTotal)}`}>
                  {fmtPct(mtdTotal, frcTotal)}
                </td>
              </tr>

              {/* % Reach Last Week */}
              <tr className="bg-white border-t border-gray-100">
                <td className="px-5 py-3.5 text-slate-600 font-medium text-xs">% Reach Last Week</td>
                {CATEGORIES.map(cat => (
                  <td key={cat} className="px-4 py-3.5 text-right text-gray-400 text-xs tabular-nums">
                    {fmtPct(lw[cat], forecast[cat])}
                  </td>
                ))}
                <td className="px-4 py-3.5 text-right text-gray-400 text-xs tabular-nums">
                  {fmtPct(lwTotal, frcTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-right">
        Full Month Forecast values are saved in your browser. Persistence to Google Sheets can be added when needed.
      </p>
    </div>
  );
}
