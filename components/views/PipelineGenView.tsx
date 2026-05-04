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

function sumByCategory(deals: PipelineGenDeal[]): Record<Category, number> {
  const out = Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<Category, number>;
  for (const d of deals) {
    const cat = SOURCE_MAP[d.sourceType];
    if (cat) out[cat] += d.amount;
  }
  return out;
}

// ─── MTD helpers ──────────────────────────────────────────────────────────────

function latestMonthPrefix(deals: PipelineGenDeal[]): string {
  const now     = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (deals.some(d => d.createDate.startsWith(current))) return current;
  const prefixes = deals.map(d => d.createDate.substring(0, 7)).filter(Boolean);
  return prefixes.length ? prefixes.sort().at(-1)! : current;
}

function filterMTD(deals: PipelineGenDeal[], prefix: string): PipelineGenDeal[] {
  return deals.filter(d => d.createDate.startsWith(prefix));
}

function pctThroughMonth(prefix: string): number {
  const now     = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (prefix !== current) return 100;
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round((now.getDate() / days) * 100);
}

// ─── QTD helpers ──────────────────────────────────────────────────────────────

interface QtrInfo { year: number; q: number; isCurrent: boolean }

function latestQtrInfo(deals: PipelineGenDeal[]): QtrInfo {
  const now      = new Date();
  const curYear  = now.getFullYear();
  const curQ     = Math.ceil((now.getMonth() + 1) / 3);
  const hasNow   = deals.some(d => {
    if (!d.createDate) return false;
    const y = parseInt(d.createDate.substring(0, 4));
    const m = parseInt(d.createDate.substring(5, 7));
    return y === curYear && Math.ceil(m / 3) === curQ;
  });
  if (hasNow) return { year: curYear, q: curQ, isCurrent: true };
  let ly = 0, lq = 0;
  for (const d of deals) {
    if (!d.createDate) continue;
    const y = parseInt(d.createDate.substring(0, 4));
    const m = parseInt(d.createDate.substring(5, 7));
    const q = Math.ceil(m / 3);
    if (y > ly || (y === ly && q > lq)) { ly = y; lq = q; }
  }
  return { year: ly || curYear, q: lq || curQ, isCurrent: false };
}

function filterQTD(deals: PipelineGenDeal[], info: QtrInfo): PipelineGenDeal[] {
  const startM = (info.q - 1) * 3 + 1;
  const endM   = info.q * 3;
  return deals.filter(d => {
    if (!d.createDate) return false;
    const y = parseInt(d.createDate.substring(0, 4));
    const m = parseInt(d.createDate.substring(5, 7));
    return y === info.year && m >= startM && m <= endM;
  });
}

function pctThroughQtr(info: QtrInfo): number {
  if (!info.isCurrent) return 100;
  const now    = new Date();
  const startM = (info.q - 1) * 3;      // 0-based
  const endM   = info.q * 3 - 1;        // 0-based, last month of quarter
  const qStart = new Date(info.year, startM, 1);
  const qEnd   = new Date(info.year, endM + 1, 0);
  const total  = Math.round((qEnd.getTime() - qStart.getTime()) / 86_400_000) + 1;
  const elapsed = Math.round((now.getTime() - qStart.getTime()) / 86_400_000) + 1;
  return Math.min(100, Math.round((elapsed / total) * 100));
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
  if (r >= 1)   return 'text-emerald-700 font-semibold';
  if (r >= 0.7) return 'text-amber-600 font-medium';
  return 'text-red-600';
}

// ─── Shared table ─────────────────────────────────────────────────────────────

type ForecastMap = Record<Category, number>;
const EMPTY_FORECAST: ForecastMap = { Events: 0, 'Inbound Paid': 0, 'Inbound Other': 0, Outbound: 0 };

interface PipelineTableProps {
  resultLabel:   string;   // e.g. 'MTD' | 'QTD'
  forecastLabel: string;   // e.g. 'Month' | 'Quarter'
  results:       Record<Category, number>;
  lwResults:     Record<Category, number>;
  forecast:      ForecastMap;
  onForecast:    (cat: Category, v: number) => void;
}

function PipelineTable({ resultLabel, forecastLabel, results, lwResults, forecast, onForecast }: PipelineTableProps) {
  const total    = CATEGORIES.reduce((s, c) => s + results[c], 0);
  const lwTotal  = CATEGORIES.reduce((s, c) => s + lwResults[c], 0);
  const frcTotal = CATEGORIES.reduce((s, c) => s + forecast[c], 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white">
              <th className="px-5 py-3.5 text-left font-semibold text-xs uppercase tracking-wide w-52" />
              {CATEGORIES.map(cat => (
                <th key={cat} className="px-4 py-3.5 text-right font-semibold text-xs">{cat}</th>
              ))}
              <th className="px-4 py-3.5 text-right font-semibold text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Results row */}
            <tr className="bg-blue-50 border-t border-gray-100">
              <td className="px-5 py-3.5 font-semibold text-slate-700">
                <span className="underline decoration-blue-400">{resultLabel}</span> Results
              </td>
              {CATEGORIES.map(cat => (
                <td key={cat} className="px-4 py-3.5 text-right font-bold text-blue-800 tabular-nums">
                  {fmtK(results[cat])}
                </td>
              ))}
              <td className="px-4 py-3.5 text-right font-bold text-blue-800 tabular-nums">{fmtK(total)}</td>
            </tr>

            {/* Forecast row */}
            <tr className="bg-white border-t border-gray-100">
              <td className="px-5 py-3 font-semibold text-slate-700">
                Full <span className="underline decoration-gray-400">{forecastLabel}</span> Forecast
              </td>
              {CATEGORIES.map(cat => (
                <td key={cat} className="px-4 py-2.5 text-right">
                  <KInput value={forecast[cat]} onChange={v => onForecast(cat, v)} />
                </td>
              ))}
              <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">{fmtK(frcTotal)}</td>
            </tr>

            {/* % Reach */}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-5 py-3.5 font-semibold text-slate-700">% Reach</td>
              {CATEGORIES.map(cat => (
                <td key={cat} className={`px-4 py-3.5 text-right tabular-nums ${reachColour(results[cat], forecast[cat])}`}>
                  {fmtPct(results[cat], forecast[cat])}
                </td>
              ))}
              <td className={`px-4 py-3.5 text-right tabular-nums ${reachColour(total, frcTotal)}`}>
                {fmtPct(total, frcTotal)}
              </td>
            </tr>

            {/* % Reach Last Week */}
            <tr className="bg-white border-t border-gray-100">
              <td className="px-5 py-3.5 text-slate-600 font-medium text-xs">% Reach Last Week</td>
              {CATEGORIES.map(cat => (
                <td key={cat} className="px-4 py-3.5 text-right text-gray-400 text-xs tabular-nums">
                  {fmtPct(lwResults[cat], forecast[cat])}
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
  );
}

// ─── Through-period badge ─────────────────────────────────────────────────────

function ThroughBadge({ pct, unit }: { pct: number; unit: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-full w-20 h-20 text-center shadow-sm border-2 border-blue-200 bg-blue-50 shrink-0">
      <span className="text-2xl font-bold text-blue-700 leading-none">{pct}%</span>
      <span className="text-[10px] font-medium text-blue-500 leading-tight mt-1 uppercase tracking-tight">
        through<br />the {unit}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PipelineGenViewProps {
  pipelineGen:         PipelineGenDeal[];
  pipelineGenLastWeek: PipelineGenDeal[];
}

export default function PipelineGenView({ pipelineGen, pipelineGenLastWeek }: PipelineGenViewProps) {
  const [mthForecast, setMthForecast] = useState<ForecastMap>(EMPTY_FORECAST);
  const [qtrForecast, setQtrForecast] = useState<ForecastMap>(EMPTY_FORECAST);
  const [loaded,      setLoaded]      = useState(false);

  useEffect(() => {
    try {
      const m = localStorage.getItem('pipelineGenForecast');
      if (m) setMthForecast(JSON.parse(m));
      const q = localStorage.getItem('pipelineGenQtrForecast');
      if (q) setQtrForecast(JSON.parse(q));
    } catch {}
    setLoaded(true);
  }, []);

  function updateMthForecast(cat: Category, value: number) {
    const next = { ...mthForecast, [cat]: value };
    setMthForecast(next);
    try { localStorage.setItem('pipelineGenForecast', JSON.stringify(next)); } catch {}
  }

  function updateQtrForecast(cat: Category, value: number) {
    const next = { ...qtrForecast, [cat]: value };
    setQtrForecast(next);
    try { localStorage.setItem('pipelineGenQtrForecast', JSON.stringify(next)); } catch {}
  }

  // ── MTD ──
  const mthPrefix    = latestMonthPrefix(pipelineGen);
  const mtdDeals     = filterMTD(pipelineGen, mthPrefix);
  const mtdLwDeals   = filterMTD(pipelineGenLastWeek, mthPrefix);
  const mtdThrough   = pctThroughMonth(mthPrefix);
  const isMthCurrent = mthPrefix === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [prefY, prefM] = mthPrefix.split('-').map(Number);
  const monthLabel   = new Date(prefY, prefM - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  // ── QTD ──
  const qtrInfo      = latestQtrInfo(pipelineGen);
  const qtdDeals     = filterQTD(pipelineGen, qtrInfo);
  const qtdLwDeals   = filterQTD(pipelineGenLastWeek, qtrInfo);
  const qtrThrough   = pctThroughQtr(qtrInfo);
  const quarterLabel = `Q${qtrInfo.q} ${qtrInfo.year}`;

  if (!loaded) return null;

  return (
    <div className="space-y-8">

      {/* ════ MTD section ════ */}
      <div className="space-y-4">
        {!isMthCurrent && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
            No data for the current month yet — showing <strong>{monthLabel}</strong> (most recent available).
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isMthCurrent ? 'MTD ' : ''}Pipeline Generation
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {monthLabel} · New Business · grouped by deal create date &amp; source type
            </p>
          </div>
          <ThroughBadge pct={mtdThrough} unit="month" />
        </div>

        <PipelineTable
          resultLabel="MTD" forecastLabel="Month"
          results={sumByCategory(mtdDeals)}
          lwResults={sumByCategory(mtdLwDeals)}
          forecast={mthForecast}
          onForecast={updateMthForecast}
        />
      </div>

      {/* ════ QTD section ════ */}
      <div className="space-y-4">
        {!qtrInfo.isCurrent && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
            No data for the current quarter yet — showing <strong>{quarterLabel}</strong> (most recent available).
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {qtrInfo.isCurrent ? 'QTD ' : ''}Pipeline Generation
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {quarterLabel} · New Business · grouped by deal create date &amp; source type
            </p>
          </div>
          <ThroughBadge pct={qtrThrough} unit="quarter" />
        </div>

        <PipelineTable
          resultLabel="QTD" forecastLabel="Quarter"
          results={sumByCategory(qtdDeals)}
          lwResults={sumByCategory(qtdLwDeals)}
          forecast={qtrForecast}
          onForecast={updateQtrForecast}
        />
      </div>

      <p className="text-xs text-gray-400 text-right">
        Forecast values are saved in your browser per period.
      </p>
    </div>
  );
}
