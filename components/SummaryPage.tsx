'use client';

import { useState } from 'react';
import { Deal, AreaKey, AREAS, SDForecastEntry, OverviewComment } from '@/lib/types';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtK(v: number) {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  return (v < 0 ? '-' : '') + '£' + (abs >= 1_000_000 ? (abs / 1_000_000).toFixed(1) + 'M' : Math.round(abs / 1000) + 'k');
}
function fmtFull(v: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v);
}
function fmtPct(v: number) {
  return (v >= 0 ? '+' : '') + Math.round(v) + '%';
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Period filters ───────────────────────────────────────────────────────────

function pctThroughMonth(): number {
  const now  = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.round((now.getDate() / days) * 100);
}

function pctThroughQuarter(): number {
  const now    = new Date();
  const q      = Math.ceil((now.getMonth() + 1) / 3);
  const startM = (q - 1) * 3;
  const endM   = q * 3 - 1;
  const qStart = new Date(now.getFullYear(), startM, 1);
  const qEnd   = new Date(now.getFullYear(), endM + 1, 0);
  const total  = Math.round((qEnd.getTime() - qStart.getTime()) / 86_400_000) + 1;
  const elapsed = Math.round((now.getTime() - qStart.getTime()) / 86_400_000) + 1;
  return Math.min(100, Math.round((elapsed / total) * 100));
}

function filterMonth(deals: Deal[], yearOffset = 0): Deal[] {
  const now = new Date();
  const y   = now.getFullYear() + yearOffset;
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  return deals.filter(d => d.closeDate?.startsWith(`${y}-${m}`));
}

function filterQuarter(deals: Deal[], yearOffset = 0): Deal[] {
  const now    = new Date();
  const y      = now.getFullYear() + yearOffset;
  const q      = Math.ceil((now.getMonth() + 1) / 3);
  const startM = (q - 1) * 3 + 1;
  const endM   = q * 3;
  return deals.filter(d => {
    if (!d.closeDate) return false;
    const dy = parseInt(d.closeDate.substring(0, 4));
    const dm = parseInt(d.closeDate.substring(5, 7));
    return dy === y && dm >= startM && dm <= endM;
  });
}

function closedWon(deals: Deal[]): number {
  return deals.filter(d => d.probability >= 0.99).reduce((s, d) => s + d.value, 0);
}

// ─── Delta cell ───────────────────────────────────────────────────────────────

function DeltaCell({ delta, base }: { delta: number | null; base: number | null }) {
  if (delta === null || base === null) return <span className="text-gray-300 text-xs">—</span>;
  if (delta === 0 && base === 0) return <span className="text-gray-400 text-xs">—</span>;
  const color = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-gray-400';
  const pct   = base !== 0 ? (delta / Math.abs(base)) * 100 : null;
  return (
    <div className={`${color} font-medium tabular-nums`}>
      <div className="text-sm">{delta > 0 ? '+' : ''}{fmtK(delta)}</div>
      {pct !== null && <div className="text-xs opacity-70">{fmtPct(pct)}</div>}
    </div>
  );
}

// ─── Comment box ──────────────────────────────────────────────────────────────

function CommentBox({ period, initial, updatedAt: initUpdatedAt }: { period: string; initial: string; updatedAt?: string }) {
  const [text,    setText]    = useState(initial);
  const [saved,   setSaved]   = useState(initial);
  const [saving,  setSaving]  = useState(false);
  const [savedAt, setSavedAt] = useState(initUpdatedAt);
  const isDirty = text !== saved;

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch('/api/overview-comment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, comment: text }),
      });
      const json = await res.json();
      if (json.ok) {
        setSaved(text);
        setSavedAt(new Date().toISOString());
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Commentary</span>
        {savedAt && <span className="text-xs text-gray-400">Last saved: {fmtDate(savedAt)}</span>}
      </div>
      <div className="p-4 space-y-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Add commentary for this period…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-slate-700 placeholder-gray-300"
        />
        <div className="flex items-center justify-end gap-3">
          {isDirty && !saving && (
            <button onClick={() => setText(saved)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Discard
            </button>
          )}
          <button
            onClick={submit}
            disabled={!isDirty || saving}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDirty && !saving ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Results table ────────────────────────────────────────────────────────────

interface RowData {
  label:      string;
  areaKey?:   AreaKey;
  accentColor?: string;
  cw:         number;
  wow:        number;
  wowBase:    number;
  yoy:        number | null;
  yoyBase:    number | null;
  vsM:        number | null;
  vsMBase:    number | null;
}

interface ResultsTableProps {
  rows:       RowData[];
  onAreaClick:(area: AreaKey) => void;
}

function ResultsTable({ rows, onAreaClick }: ResultsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white">
              <th className="px-5 py-3.5 text-left font-semibold text-xs uppercase tracking-wide">Area</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">Closed Won</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">WoW</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">YoY</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">vs Forecast</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => {
              const isTotal = !row.areaKey;
              return (
                <tr
                  key={row.label}
                  onClick={() => row.areaKey && onAreaClick(row.areaKey)}
                  className={`transition-colors ${row.areaKey ? 'cursor-pointer hover:bg-blue-50/30' : 'bg-gray-50 font-bold border-t-2 border-gray-200'} ${!isTotal && i % 2 !== 0 ? 'bg-gray-50/40' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {row.accentColor && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.accentColor }} />
                      )}
                      <span className={isTotal ? 'text-slate-800 text-sm' : 'font-medium text-slate-700'}>{row.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-bold ${row.cw > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>
                      {row.cw > 0 ? fmtFull(row.cw) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DeltaCell delta={row.wow} base={row.wowBase} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <DeltaCell delta={row.yoy} base={row.yoyBase} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {row.vsM !== null
                      ? <DeltaCell delta={row.vsM} base={row.vsMBase} />
                      : <span className="text-gray-300 text-xs italic">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, pct, unit }: { title: string; pct: number; unit: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center justify-center rounded-full w-16 h-16 text-center shadow-sm border-2 border-blue-200 bg-blue-50 shrink-0">
        <span className="text-lg font-bold text-blue-700 leading-none">{pct}%</span>
        <span className="text-[9px] font-medium text-blue-500 leading-tight mt-0.5 uppercase tracking-tight">
          thru<br />{unit}
        </span>
      </div>
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SummaryPageProps {
  allThisWeek:      Deal[];
  allLastWeek:      Deal[];
  sdForecasts:      SDForecastEntry[];
  overviewComments: OverviewComment[];
  onAreaClick:      (area: AreaKey) => void;
}

export default function SummaryPage({ allThisWeek, allLastWeek, sdForecasts, overviewComments, onAreaClick }: SummaryPageProps) {
  const now      = new Date();
  const curY     = now.getFullYear();
  const curQ     = Math.ceil((now.getMonth() + 1) / 3);
  const mthKey   = `${curY}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const qtrKey   = `${curY}-Q${curQ}`;
  const mthLabel = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const qtrLabel = `Q${curQ} ${curY}`;

  const mthComment = overviewComments.find(c => c.period === mthKey);
  const qtrComment = overviewComments.find(c => c.period === qtrKey);

  function buildRows(
    filterFn:      (d: Deal[], offset?: number) => Deal[],
    sdPeriod:      'month' | 'quarter',
  ): RowData[] {
    const rows: RowData[] = [];

    for (const area of AREAS) {
      const twArea   = allThisWeek.filter(d => d.area === area.key);
      const lwArea   = allLastWeek.filter(d => d.area === area.key);

      const cw       = closedWon(filterFn(twArea));
      const lwCw     = closedWon(filterFn(lwArea));
      const priorCw  = closedWon(filterFn(twArea, -1));

      const sd       = sdForecasts.find(f => f.area === area.key);
      const sdTarget = sd ? sd[sdPeriod].closedWon + sd[sdPeriod].commit : null;

      rows.push({
        label:       area.label,
        areaKey:     area.key,
        accentColor: area.accentColor,
        cw,
        wow:         cw - lwCw,
        wowBase:     lwCw,
        yoy:         priorCw > 0 || cw > 0 ? cw - priorCw : null,
        yoyBase:     priorCw > 0 ? priorCw : null,
        vsM:         sdTarget !== null ? cw - sdTarget : null,
        vsMBase:     sdTarget,
      });
    }

    // Total row
    const totalCw    = rows.reduce((s, r) => s + r.cw, 0);
    const totalWow   = rows.reduce((s, r) => s + r.wow, 0);
    const totalWowB  = rows.reduce((s, r) => s + r.wowBase, 0);
    const anyYoy     = rows.some(r => r.yoy !== null);
    const totalYoy   = anyYoy ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const totalYoyB  = anyYoy ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const anyVsM     = rows.some(r => r.vsM !== null);
    const totalVsM   = anyVsM ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const totalVsMB  = anyVsM ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;

    rows.push({
      label: 'Total', cw: totalCw,
      wow: totalWow, wowBase: totalWowB,
      yoy: totalYoy, yoyBase: totalYoyB,
      vsM: totalVsM, vsMBase: totalVsMB,
    });

    return rows;
  }

  const mthRows = buildRows(filterMonth, 'month');
  const qtrRows = buildRows(filterQuarter, 'quarter');

  return (
    <div className="space-y-8">

      {/* ── Month section ── */}
      <div className="space-y-4">
        <SectionHeader title={`${mthLabel} Results`} pct={pctThroughMonth()} unit="month" />
        <ResultsTable rows={mthRows} onAreaClick={onAreaClick} />
        <CommentBox
          period={mthKey}
          initial={mthComment?.comment ?? ''}
          updatedAt={mthComment?.updatedAt}
        />
      </div>

      {/* ── Quarter section ── */}
      <div className="space-y-4">
        <SectionHeader title={`${qtrLabel} Results`} pct={pctThroughQuarter()} unit="qtr" />
        <ResultsTable rows={qtrRows} onAreaClick={onAreaClick} />
        <CommentBox
          period={qtrKey}
          initial={qtrComment?.comment ?? ''}
          updatedAt={qtrComment?.updatedAt}
        />
      </div>

    </div>
  );
}
