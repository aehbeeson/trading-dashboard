'use client';

import { useState, useEffect, useRef } from 'react';
import { Deal, AreaKey, SDForecastEntry, PeriodForecast } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function localISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function monthRange(): [string, string] {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  return [localISO(y, m, 1), localISO(y, m, new Date(y, m, 0).getDate())];
}

function quarterRange(): [string, string] {
  const now = new Date();
  const y = now.getFullYear();
  const qStart = Math.floor(now.getMonth() / 3) * 3 + 1;
  const qEnd   = qStart + 2;
  return [localISO(y, qStart, 1), localISO(y, qEnd, new Date(y, qEnd, 0).getDate())];
}

function filterByDate(deals: Deal[], from: string, to: string) {
  return deals.filter(d => {
    const dt = d.closeDate ? d.closeDate.substring(0, 10) : '';
    if (!dt) return true;
    if (from && dt < from) return false;
    if (to   && dt > to)   return false;
    return true;
  });
}

function fmtK(v: number) {
  if (v === 0) return '-';
  return '£' + Math.round(v / 1000) + 'k';
}

function fmtKRaw(v: number) {
  return '£' + Math.round(v / 1000) + 'k';
}

// ─── Pipeline calculation ────────────────────────────────────────────────────

type RowKey = 'closedWon' | 'commit' | 'bestCase' | 'pipeline' | 'omitted';

interface PipelineCalc extends Record<RowKey, number> {
  total: number;
}

function calcPipeline(deals: Deal[]): PipelineCalc {
  const closedWon = deals.filter(d => d.probability >= 0.99).reduce((s, d) => s + d.value, 0);
  const commit    = deals.filter(d => d.forecastCategory === 'Commit'    && d.probability < 0.99).reduce((s, d) => s + d.value, 0);
  const bestCase  = deals.filter(d => d.forecastCategory === 'Best Case').reduce((s, d) => s + d.value, 0);
  const pipeline  = deals.filter(d => d.forecastCategory === 'Pipeline' ).reduce((s, d) => s + d.value, 0);
  const omitted   = deals.filter(d => d.forecastCategory === 'Omitted'  ).reduce((s, d) => s + d.value, 0);
  return { closedWon, commit, bestCase, pipeline, omitted, total: closedWon + commit + bestCase + pipeline + omitted };
}

// ─── SD Forecast state ───────────────────────────────────────────────────────

const EMPTY_PERIOD: PeriodForecast = { closedWon: 0, commit: 0, bestCase: 0, pipeline: 0, omitted: 0 };

interface SDForecast {
  month:      PeriodForecast;
  quarter:    PeriodForecast;
  mainDeals:  string;
  otherDeals: string;
}

const EMPTY_FORECAST: SDForecast = {
  month:      { ...EMPTY_PERIOD },
  quarter:    { ...EMPTY_PERIOD },
  mainDeals:  '',
  otherDeals: '',
};

const ROWS: Array<{ key: RowKey; label: string; won?: boolean }> = [
  { key: 'closedWon', label: 'Closed Won',    won: true },
  { key: 'commit',    label: 'Commit'                   },
  { key: 'bestCase',  label: 'Best Case'                },
  { key: 'pipeline',  label: 'Pipeline'                 },
  { key: 'omitted',   label: 'Not Forecasted'           },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SDInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState(value > 0 ? String(Math.round(value / 1000)) : '');

  useEffect(() => {
    setRaw(value > 0 ? String(Math.round(value / 1000)) : '');
  }, [value]);

  return (
    <div className="flex items-center justify-end gap-0.5">
      <span className="text-gray-400 text-xs select-none">£</span>
      <input
        type="number"
        min={0}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={() => {
          const n = parseFloat(raw) || 0;
          onChange(Math.round(n * 1000));
          setRaw(n > 0 ? String(n) : '');
        }}
        placeholder="—"
        className="w-20 text-right border border-gray-200 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
      />
      <span className="text-gray-400 text-xs select-none">k</span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ForecastViewProps {
  deals: Deal[];      // all this-week deals for this area, unfiltered by global date
  area: AreaKey;
  accentColor: string;
  serverForecast: SDForecastEntry | null;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function ForecastView({ deals, area, serverForecast }: ForecastViewProps) {
  const [sd, setSd]         = useState<SDForecast>(EMPTY_FORECAST);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const saveTimer           = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise: prefer server data, fall back to localStorage
  useEffect(() => {
    if (serverForecast) {
      setSd({
        month:      serverForecast.month,
        quarter:    serverForecast.quarter,
        mainDeals:  serverForecast.mainDeals,
        otherDeals: serverForecast.otherDeals,
      });
    } else {
      try {
        const raw = localStorage.getItem(`sdForecast_${area}`);
        if (raw) setSd(JSON.parse(raw));
      } catch {}
    }
    setLoaded(true);
  }, [area, serverForecast]);

  function save(next: SDForecast) {
    setSd(next);
    // Persist to localStorage immediately for instant local cache
    try { localStorage.setItem(`sdForecast_${area}`, JSON.stringify(next)); } catch {}

    // Debounce the server write by 800ms so rapid typing doesn't flood the API
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/forecast', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ area, ...next }),
        });
        const json = await res.json();
        setStatus(json.ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
      setTimeout(() => setStatus('idle'), 3000);
    }, 800);
  }

  function setSDValue(period: 'month' | 'quarter', key: RowKey, value: number) {
    save({ ...sd, [period]: { ...sd[period], [key]: value } });
  }

  function setComment(field: 'mainDeals' | 'otherDeals', value: string) {
    save({ ...sd, [field]: value });
  }

  const [mFrom, mTo] = monthRange();
  const [qFrom, qTo] = quarterRange();
  const monthCalc   = calcPipeline(filterByDate(deals, mFrom, mTo));
  const quarterCalc = calcPipeline(filterByDate(deals, qFrom, qTo));

  const sdMonthTotal   = (Object.keys(EMPTY_PERIOD) as RowKey[]).reduce((s, k) => s + sd.month[k],   0);
  const sdQuarterTotal = (Object.keys(EMPTY_PERIOD) as RowKey[]).reduce((s, k) => s + sd.quarter[k], 0);

  // Avoid hydration mismatch on localStorage reads
  if (!loaded) return null;

  const monthLabel   = new Date().toLocaleDateString('en-GB', { month: 'long' });
  const quarterLabel = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

  return (
    <div>
      {/* ── Forecast table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white text-xs">
                <th className="px-5 py-3 text-left font-semibold w-44" />

                {/* Month section */}
                <th className="px-4 py-3 text-right font-semibold">
                  <span className="underline">{monthLabel} Pipeline View</span>
                </th>
                <th className="px-4 py-3 text-right font-semibold">SD Forecast</th>

                {/* Visual gap */}
                <th className="w-4 bg-slate-700" />

                {/* Quarter section */}
                <th className="px-4 py-3 text-right font-semibold">
                  <span className="underline">{quarterLabel} Pipeline View</span>
                </th>
                <th className="px-4 py-3 text-right font-semibold">SD Forecast</th>
              </tr>
            </thead>

            <tbody>
              {ROWS.map(row => (
                <tr
                  key={row.key}
                  className={`border-t border-gray-100 ${row.won ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                >
                  <td className={`px-5 py-3 font-semibold ${row.won ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {row.label}
                  </td>

                  {/* Month pipeline (calculated) */}
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">
                    {fmtK(monthCalc[row.key])}
                  </td>

                  {/* Month SD input */}
                  <td className="px-4 py-2.5 text-right">
                    <SDInput
                      value={sd.month[row.key]}
                      onChange={v => setSDValue('month', row.key, v)}
                    />
                  </td>

                  <td className="bg-slate-100" />

                  {/* Quarter pipeline (calculated) */}
                  <td className="px-4 py-3 text-right text-slate-700 font-medium">
                    {fmtK(quarterCalc[row.key])}
                  </td>

                  {/* Quarter SD input */}
                  <td className="px-4 py-2.5 text-right">
                    <SDInput
                      value={sd.quarter[row.key]}
                      onChange={v => setSDValue('quarter', row.key, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-yellow-400 bg-yellow-300 font-bold text-slate-900">
                <td className="px-5 py-3">Total</td>
                <td className="px-4 py-3 text-right">{fmtKRaw(monthCalc.total)}</td>
                <td className="px-4 py-3 text-right">{fmtKRaw(sdMonthTotal)}</td>
                <td className="bg-yellow-200" />
                <td className="px-4 py-3 text-right">{fmtKRaw(quarterCalc.total)}</td>
                <td className="px-4 py-3 text-right">{fmtKRaw(sdQuarterTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-slate-800 mb-3">Main {monthLabel} Deals</h3>
          <textarea
            value={sd.mainDeals}
            onChange={e => setComment('mainDeals', e.target.value)}
            placeholder={"• Company €40K: chosen provider, working on signature.\n• Company €25K: decision meeting tomorrow."}
            rows={7}
            className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 placeholder-gray-300 leading-relaxed"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-slate-800 mb-3">Other Main Deals</h3>
          <textarea
            value={sd.otherDeals}
            onChange={e => setComment('otherDeals', e.target.value)}
            placeholder={"• Company €160K: currently in eval stage, engaging with L&D Manager.\n• Company €85K: RfI submitted, awaiting RfP launch."}
            rows={7}
            className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700 placeholder-gray-300 leading-relaxed"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end items-center gap-2 text-xs">
        {status === 'saving' && <span className="text-gray-400">Saving to Google Sheets…</span>}
        {status === 'saved'  && <span className="text-emerald-600">Saved to Google Sheets</span>}
        {status === 'error'  && <span className="text-red-500">Save failed — changes kept locally</span>}
        {serverForecast?.updatedAt && status === 'idle' && (
          <span className="text-gray-400">
            Last saved {new Date(serverForecast.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}
