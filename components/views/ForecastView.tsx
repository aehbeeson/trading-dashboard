'use client';

import { useState, useEffect } from 'react';
import { Deal, AreaKey, SDForecastEntry, PeriodForecast } from '@/lib/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function localISO(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function monthRange(): [string, string] {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1;
  return [localISO(y, m, 1), localISO(y, m, new Date(y, m, 0).getDate())];
}
function quarterRange(): [string, string] {
  const now = new Date(), y = now.getFullYear();
  const qs = Math.floor(now.getMonth() / 3) * 3 + 1, qe = qs + 2;
  return [localISO(y, qs, 1), localISO(y, qe, new Date(y, qe, 0).getDate())];
}
function filterByDate(deals: Deal[], from: string, to: string) {
  return deals.filter(d => {
    const dt = d.closeDate?.substring(0, 10) ?? '';
    if (!dt) return true;
    if (from && dt < from) return false;
    if (to   && dt > to)   return false;
    return true;
  });
}
function fmtK(v: number) {
  return v === 0 ? '—' : '£' + Math.round(v / 1000) + 'k';
}

// ─── Pipeline calculation ────────────────────────────────────────────────────

type RowKey = 'closedWon' | 'commit' | 'bestCase' | 'pipeline' | 'omitted';

interface PipelineCalc extends Record<RowKey, number> { total: number; }

function calcPipeline(deals: Deal[]): PipelineCalc {
  const closedWon = deals.filter(d => d.probability >= 0.99).reduce((s, d) => s + d.value, 0);
  const commit    = deals.filter(d => d.forecastCategory === 'Commit'    && d.probability < 0.99).reduce((s, d) => s + d.value, 0);
  const bestCase  = deals.filter(d => d.forecastCategory === 'Best Case').reduce((s, d) => s + d.value, 0);
  const pipeline  = deals.filter(d => d.forecastCategory === 'Pipeline' ).reduce((s, d) => s + d.value, 0);
  const omitted   = deals.filter(d => d.forecastCategory === 'Omitted'  ).reduce((s, d) => s + d.value, 0);
  return { closedWon, commit, bestCase, pipeline, omitted, total: closedWon + commit + bestCase + pipeline + omitted };
}

// ─── State types ─────────────────────────────────────────────────────────────

interface SDForecast {
  month:      PeriodForecast;
  quarter:    PeriodForecast;
  mainDeals:  string;
  otherDeals: string;
}

const EMPTY_PERIOD: PeriodForecast = { closedWon: 0, commit: 0, bestCase: 0, pipeline: 0, omitted: 0 };
const EMPTY_FORECAST: SDForecast   = { month: { ...EMPTY_PERIOD }, quarter: { ...EMPTY_PERIOD }, mainDeals: '', otherDeals: '' };

const ROWS: Array<{ key: RowKey; label: string; readOnly?: boolean }> = [
  { key: 'closedWon', label: 'Closed Won',    readOnly: true },
  { key: 'commit',    label: 'Commit'                        },
  { key: 'bestCase',  label: 'Best Case'                     },
  { key: 'pipeline',  label: 'Pipeline'                      },
  { key: 'omitted',   label: 'Not Forecasted'                },
];

// ─── £k input ────────────────────────────────────────────────────────────────

function KInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(value > 0 ? String(Math.round(value / 1000)) : '');

  useEffect(() => { setText(value > 0 ? String(Math.round(value / 1000)) : ''); }, [value]);

  return (
    <div className="flex items-center justify-end gap-1">
      <span className="text-gray-400 text-xs select-none">£</span>
      <input
        type="number"
        min={0}
        value={text}
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

// ─── Main component ──────────────────────────────────────────────────────────

interface ForecastViewProps {
  deals:          Deal[];
  area:           AreaKey;
  accentColor:    string;
  serverForecast: SDForecastEntry | null;
}

export default function ForecastView({ deals, area, accentColor, serverForecast }: ForecastViewProps) {
  const [saved,     setSaved]     = useState<SDForecast>(EMPTY_FORECAST);
  const [draft,     setDraft]     = useState<SDForecast>(EMPTY_FORECAST);
  const [isDirty,   setIsDirty]   = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [submitOk,  setSubmitOk]  = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    let initial = EMPTY_FORECAST;
    if (serverForecast) {
      initial    = { month: serverForecast.month, quarter: serverForecast.quarter, mainDeals: serverForecast.mainDeals, otherDeals: serverForecast.otherDeals };
      setLastSaved(serverForecast.updatedAt);
    } else {
      try { const raw = localStorage.getItem(`sdForecast_${area}`); if (raw) initial = JSON.parse(raw); } catch {}
    }
    setSaved(initial);
    setDraft(initial);
    setLoaded(true);
  }, [area, serverForecast]);

  function updateDraft(next: SDForecast) {
    setDraft(next);
    setIsDirty(true);
    setSubmitOk(false);
  }

  async function handleSubmit() {
    setIsSaving(true);
    try {
      const res  = await fetch('/api/forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ area, ...draft }) });
      const json = await res.json();
      if (json.ok !== false) {
        setSaved(draft);
        setIsDirty(false);
        setSubmitOk(true);
        const now = new Date().toISOString();
        setLastSaved(now);
        try { localStorage.setItem(`sdForecast_${area}`, JSON.stringify(draft)); } catch {}
        setTimeout(() => setSubmitOk(false), 4000);
      }
    } catch { /* network error — draft stays dirty */ }
    setIsSaving(false);
  }

  function discard() { setDraft(saved); setIsDirty(false); setSubmitOk(false); }

  const [mFrom, mTo] = monthRange();
  const [qFrom, qTo] = quarterRange();
  const mCalc = calcPipeline(filterByDate(deals, mFrom, mTo));
  const qCalc = calcPipeline(filterByDate(deals, qFrom, qTo));

  // SD totals always use calculated closedWon (not stored) + entered values
  const sdMTotal = mCalc.closedWon + draft.month.commit   + draft.month.bestCase   + draft.month.pipeline   + draft.month.omitted;
  const sdQTotal = qCalc.closedWon + draft.quarter.commit + draft.quarter.bestCase + draft.quarter.pipeline + draft.quarter.omitted;

  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const qLabel     = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

  if (!loaded) return null;

  return (
    <div className="space-y-5">

      {/* ── Action bar ── */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3.5">
        <p className="text-sm text-gray-500">
          {lastSaved
            ? <>Last submitted <span className="text-slate-700 font-medium">{new Date(lastSaved).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></>
            : <span className="text-gray-400">No submission yet</span>
          }
        </p>
        <div className="flex items-center gap-3">
          {submitOk && !isDirty && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Submitted to Google Sheets
            </span>
          )}
          {isDirty && (
            <>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                Unsaved changes
              </span>
              <button onClick={discard} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Discard
              </button>
            </>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isDirty || isSaving}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              isDirty
                ? 'bg-slate-900 text-white hover:bg-slate-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Submitting…' : 'Submit Forecast'}
          </button>
        </div>
      </div>

      {/* ── Forecast table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white">
                <th className="px-5 py-3.5 text-left font-semibold w-44 text-xs uppercase tracking-wide">Category</th>
                <th className="px-4 py-3.5 text-right font-semibold text-xs">
                  {monthLabel}<br /><span className="font-normal opacity-60 text-xs">Pipeline View</span>
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-xs">
                  SD Forecast
                </th>
                <th className="w-3 bg-slate-700/50" />
                <th className="px-4 py-3.5 text-right font-semibold text-xs">
                  {qLabel}<br /><span className="font-normal opacity-60 text-xs">Pipeline View</span>
                </th>
                <th className="px-4 py-3.5 text-right font-semibold text-xs">
                  SD Forecast
                </th>
              </tr>
            </thead>

            <tbody>
              {ROWS.map((row, i) => {
                const isWon = row.readOnly;
                const base  = isWon ? 'bg-emerald-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
                return (
                  <tr key={row.key} className={`border-t border-gray-100 ${base}`}>
                    <td className={`px-5 py-3 font-semibold ${isWon ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {row.label}
                      {isWon && <span className="ml-2 text-xs font-normal text-emerald-500 opacity-75">calculated</span>}
                    </td>

                    {/* Month pipeline */}
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${isWon ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {fmtK(mCalc[row.key])}
                    </td>

                    {/* Month SD */}
                    <td className="px-4 py-2.5 text-right">
                      {isWon
                        ? <span className="text-emerald-700 font-medium tabular-nums">{fmtK(mCalc.closedWon)}</span>
                        : <KInput value={draft.month[row.key]} onChange={v => updateDraft({ ...draft, month: { ...draft.month, [row.key]: v } })} />
                      }
                    </td>

                    <td className="w-3 bg-gray-100" />

                    {/* Quarter pipeline */}
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${isWon ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {fmtK(qCalc[row.key])}
                    </td>

                    {/* Quarter SD */}
                    <td className="px-4 py-2.5 text-right">
                      {isWon
                        ? <span className="text-emerald-700 font-medium tabular-nums">{fmtK(qCalc.closedWon)}</span>
                        : <KInput value={draft.quarter[row.key]} onChange={v => updateDraft({ ...draft, quarter: { ...draft.quarter, [row.key]: v } })} />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-5 py-3.5 font-bold text-slate-800 text-sm">Total</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-800 tabular-nums">{fmtK(mCalc.total)}</td>
                <td className="px-4 py-3.5 text-right font-bold tabular-nums" style={{ color: accentColor }}>{fmtK(sdMTotal)}</td>
                <td className="bg-gray-100" />
                <td className="px-4 py-3.5 text-right font-bold text-slate-800 tabular-nums">{fmtK(qCalc.total)}</td>
                <td className="px-4 py-3.5 text-right font-bold tabular-nums" style={{ color: accentColor }}>{fmtK(sdQTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { field: 'mainDeals'  as const, title: `Main ${new Date().toLocaleDateString('en-GB', { month: 'long' })} Deals`,  placeholder: '• Company €40K: chosen provider, working on signature.\n• Company €25K: decision meeting tomorrow.' },
          { field: 'otherDeals' as const, title: 'Other Main Deals', placeholder: '• Company €160K: currently in eval stage.\n• Company €85K: RfI submitted, awaiting RfP launch.' },
        ].map(({ field, title, placeholder }) => (
          <div key={field} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm">{title}</h3>
            <textarea
              value={draft[field]}
              onChange={e => updateDraft({ ...draft, [field]: e.target.value })}
              placeholder={placeholder}
              rows={7}
              className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-gray-700 placeholder-gray-300 leading-relaxed"
            />
          </div>
        ))}
      </div>

    </div>
  );
}
