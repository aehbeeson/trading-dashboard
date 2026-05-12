'use client';

import { useState } from 'react';
import { Deal, AreaKey, AREAS, SDForecastEntry, OverviewComment, MastersheetForecast } from '@/lib/types';

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtK(v: number) {
  if (v === 0) return '—';
  const abs = Math.abs(v);
  return (v < 0 ? '-' : '') + '€' + (abs >= 1_000_000 ? (abs / 1_000_000).toFixed(1) + 'M' : Math.round(abs / 1000) + 'k');
}
function fmtPct(v: number) {
  return (v >= 0 ? '+' : '') + Math.round(v) + '%';
}

// ─── Period filters ───────────────────────────────────────────────────────────

function filterMonth(deals: Deal[], year: number, month: number, yearOffset = 0): Deal[] {
  const y = year + yearOffset;
  const m = String(month).padStart(2, '0');
  return deals.filter(d => d.closeDate?.startsWith(`${y}-${m}`));
}

function filterQuarter(deals: Deal[], year: number, quarter: number, yearOffset = 0): Deal[] {
  const y      = year + yearOffset;
  const startM = (quarter - 1) * 3 + 1;
  const endM   = quarter * 3;
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
  if (delta === 0 && base === 0)       return <span className="text-gray-400 text-xs">—</span>;
  const color     = delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-gray-400';
  const pct       = base !== 0 ? (delta / Math.abs(base)) * 100 : null;
  const bubbleCls = delta > 0 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60' : delta < 0 ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/60' : 'bg-gray-50 text-gray-500';
  return (
    <div className={`${color} font-semibold tabular-nums flex items-center justify-end gap-1.5`}>
      <span className="text-sm">{delta > 0 ? '+' : ''}{fmtK(delta)}</span>
      {pct !== null && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${bubbleCls}`}>{fmtPct(pct)}</span>
      )}
    </div>
  );
}

// ─── Results table ────────────────────────────────────────────────────────────

interface RowData {
  label:        string;
  areaKey?:     AreaKey;
  accentColor?: string;
  cw:           number;
  sdForecast:   number | null;
  wow:          number;
  wowBase:      number;
  yoy:          number | null;
  yoyBase:      number | null;
  vsM:          number | null;
  vsMBase:      number | null;
}

function DataRow({ row, period, comment, onAreaClick }: {
  row:         RowData;
  period:      string;
  comment:     string;
  onAreaClick: (area: AreaKey) => void;
}) {
  const [draft,   setDraft]   = useState(comment);
  const [saved,   setSaved]   = useState(comment);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const isTotal = !row.areaKey;
  const areaKey = row.areaKey ?? 'total';

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/overview-comment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ period: `${period}:${areaKey}`, comment: draft }),
      });
      setSaved(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className={`border-b border-gray-100 last:border-0 group transition-colors ${
      isTotal
        ? 'bg-slate-50/80 font-semibold'
        : 'hover:bg-slate-50/50'
    }`}>
      <td className="px-5 py-3">
        <div
          onClick={() => row.areaKey && onAreaClick(row.areaKey)}
          className={`flex items-center gap-2.5 ${row.areaKey ? 'cursor-pointer' : ''}`}
        >
          {row.accentColor && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_0_3px_rgba(255,255,255,1)] ring-1 ring-black/5"
              style={{ backgroundColor: row.accentColor }}
            />
          )}
          {isTotal && (
            <span className="w-2 h-2 flex-shrink-0" />
          )}
          <span className={`${
            isTotal
              ? 'text-slate-900 text-sm font-semibold'
              : 'font-medium text-slate-800 group-hover:text-slate-900 transition-colors'
          }`}>
            {row.label}
          </span>
        </div>

        {!isTotal && (editing ? (
          <div className="flex items-start gap-2 mt-2 ml-[18px]">
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
              placeholder="Add commentary…"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300/60 focus:border-blue-300 resize-none text-slate-700 placeholder-gray-300 bg-white"
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={save}
                disabled={saving}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setDraft(saved); setEditing(false); }}
                className="px-2.5 py-1 text-[10px] font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p onClick={() => setEditing(true)} className="ml-[18px] mt-1 cursor-text">
            {saved
              ? <span className="text-xs text-slate-500 hover:text-slate-700 leading-snug transition-colors">{saved}</span>
              : <span className="text-[11px] text-gray-300 italic hover:text-gray-400 transition-colors">Add note…</span>}
          </p>
        ))}
      </td>

      <td className="px-5 py-3 text-right align-top pt-3.5">
        {row.sdForecast !== null
          ? <span className="text-sm font-semibold text-slate-800 tabular-nums">{fmtK(row.sdForecast)}</span>
          : <span className="text-gray-300 text-xs">—</span>}
      </td>
      <td className="px-5 py-3 text-right align-top pt-3.5">
        <DeltaCell delta={row.yoy} base={row.yoyBase} />
      </td>
      <td className="px-5 py-3 text-right align-top pt-3.5">
        {row.vsM !== null
          ? <DeltaCell delta={row.vsM} base={row.vsMBase} />
          : <span className="text-gray-300 text-xs italic">—</span>}
      </td>
    </tr>
  );
}

interface ResultsTableProps {
  rows:        RowData[];
  onAreaClick: (area: AreaKey) => void;
  period:      string;
  comments:    Record<string, string>;
}

function ResultsTable({ rows, onAreaClick, period, comments }: ResultsTableProps) {
  const totalRow = rows.find(r => !r.areaKey)!;
  const areaRows = rows.filter(r => !!r.areaKey);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col />
            <col style={{ width: '170px' }} />
            <col style={{ width: '170px' }} />
            <col style={{ width: '170px' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-200">
              <th className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">Area</th>
              <th className="px-5 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">SD Forecast</th>
              <th className="px-5 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">YoY</th>
              <th className="px-5 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">vs M</th>
            </tr>
          </thead>
          <tbody>
            <DataRow row={totalRow} period={period} comment={comments['total'] ?? ''} onAreaClick={onAreaClick} />
            {areaRows.map(row => (
              <DataRow key={row.areaKey} row={row} period={period} comment={comments[row.areaKey!] ?? ''} onAreaClick={onAreaClick} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Mastersheet forecast helpers ────────────────────────────────────────────

function getMthForecast(forecasts: MastersheetForecast[], area: string, year: number, month: number, prorateTo?: Date): number | null {
  const entry = forecasts.find(f => f.area === area);
  if (!entry) return null;
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const amount = entry.months[key];
  if (amount === undefined) return null;
  if (prorateTo && year === prorateTo.getFullYear() && month === prorateTo.getMonth() + 1) {
    const daysInMonth = new Date(year, month, 0).getDate();
    return amount * (prorateTo.getDate() / daysInMonth);
  }
  return amount;
}

function getQtrForecast(forecasts: MastersheetForecast[], area: string, year: number, quarter: number, prorateTo?: Date): number | null {
  const startM = (quarter - 1) * 3 + 1;
  let total = 0;
  for (let m = startM; m < startM + 3; m++) {
    if (prorateTo) {
      const py = prorateTo.getFullYear(), pm = prorateTo.getMonth() + 1;
      if (year > py || (year === py && m > pm)) continue; // future month — skip
    }
    const v = getMthForecast(forecasts, area, year, m, prorateTo);
    if (v === null) return null;
    total += v;
  }
  return total;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SummaryPageProps {
  allThisWeek:          Deal[];
  allLastWeek:          Deal[];
  sdForecasts:          SDForecastEntry[];
  overviewComments:     OverviewComment[];
  mastersheetForecasts: MastersheetForecast[];
  monthsMForecasts:     MastersheetForecast[];
  onAreaClick:          (area: AreaKey) => void;
}

export default function SummaryPage({ allThisWeek, allLastWeek, sdForecasts: _sdForecasts, overviewComments, mastersheetForecasts, monthsMForecasts, onAreaClick }: SummaryPageProps) {
  const now  = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curQ = Math.ceil(curM / 3);

  const [selMthYear, setSelMthYear] = useState(curY);
  const [selMth,     setSelMth]     = useState(curM);
  const [selQtrYear, setSelQtrYear] = useState(curY);
  const [selQtr,     setSelQtr]     = useState(curQ);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(curY, curM - 1 - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const qtrOptions = Array.from({ length: 8 }, (_, i) => {
    let year = curY;
    let q    = curQ - i;
    while (q <= 0) { q += 4; year--; }
    return { year, quarter: q };
  });

  const mthKey   = `${selMthYear}-${String(selMth).padStart(2, '0')}`;
  const qtrKey   = `${selQtrYear}-Q${selQtr}`;
  const mthLabel = new Date(selMthYear, selMth - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const qtrLabel = `Q${selQtr} ${selQtrYear}`;

  function buildCommentMap(periodPrefix: string): Record<string, string> {
    const map: Record<string, string> = {};
    for (const key of [...AREAS.map(a => a.key), 'total']) {
      const entry = overviewComments.find(c => c.period === `${periodPrefix}:${key}`);
      map[key] = entry?.comment ?? '';
    }
    return map;
  }

  function buildMthRows(): RowData[] {
    const rows: RowData[] = [];
    for (const area of AREAS) {
      const twArea     = allThisWeek.filter(d => d.area === area.key);
      const lwArea     = allLastWeek.filter(d => d.area === area.key);
      const cw         = closedWon(filterMonth(twArea, selMthYear, selMth));
      const lwCw       = closedWon(filterMonth(lwArea, selMthYear, selMth));
      const priorCw    = closedWon(filterMonth(twArea, selMthYear, selMth, -1));
      const sdForecast = getMthForecast(mastersheetForecasts, area.key, selMthYear, selMth);
      const mTarget    = getMthForecast(monthsMForecasts,     area.key, selMthYear, selMth);
      const vsM        = sdForecast !== null && mTarget !== null ? sdForecast - mTarget : null;
      rows.push({ label: area.label, areaKey: area.key, accentColor: area.accentColor, cw, sdForecast, wow: cw - lwCw, wowBase: lwCw, yoy: priorCw > 0 || cw > 0 ? cw - priorCw : null, yoyBase: priorCw > 0 ? priorCw : null, vsM, vsMBase: mTarget });
    }
    const tc   = rows.reduce((s, r) => s + r.cw, 0);
    const tsd  = rows.every(r => r.sdForecast !== null) ? rows.reduce((s, r) => s + (r.sdForecast ?? 0), 0) : null;
    const ay   = rows.some(r => r.yoy !== null);
    const ty   = ay ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const tyb  = ay ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const av   = rows.some(r => r.vsM !== null);
    const tv   = av ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const tvb  = av ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;
    rows.push({ label: 'Total', cw: tc, sdForecast: tsd, wow: 0, wowBase: 0, yoy: ty, yoyBase: tyb, vsM: tv, vsMBase: tvb });
    return rows;
  }

  function buildQtrRows(): RowData[] {
    const rows: RowData[] = [];
    for (const area of AREAS) {
      const twArea     = allThisWeek.filter(d => d.area === area.key);
      const lwArea     = allLastWeek.filter(d => d.area === area.key);
      const cw         = closedWon(filterQuarter(twArea, selQtrYear, selQtr));
      const lwCw       = closedWon(filterQuarter(lwArea, selQtrYear, selQtr));
      const priorCw    = closedWon(filterQuarter(twArea, selQtrYear, selQtr, -1));
      const sdForecast = getQtrForecast(mastersheetForecasts, area.key, selQtrYear, selQtr);
      const mTarget    = getQtrForecast(monthsMForecasts,     area.key, selQtrYear, selQtr);
      const vsM        = sdForecast !== null && mTarget !== null ? sdForecast - mTarget : null;
      rows.push({ label: area.label, areaKey: area.key, accentColor: area.accentColor, cw, sdForecast, wow: cw - lwCw, wowBase: lwCw, yoy: priorCw > 0 || cw > 0 ? cw - priorCw : null, yoyBase: priorCw > 0 ? priorCw : null, vsM, vsMBase: mTarget });
    }
    const tc   = rows.reduce((s, r) => s + r.cw, 0);
    const tsd  = rows.every(r => r.sdForecast !== null) ? rows.reduce((s, r) => s + (r.sdForecast ?? 0), 0) : null;
    const ay   = rows.some(r => r.yoy !== null);
    const ty   = ay ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const tyb  = ay ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const av   = rows.some(r => r.vsM !== null);
    const tv   = av ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const tvb  = av ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;
    rows.push({ label: 'Total', cw: tc, sdForecast: tsd, wow: 0, wowBase: 0, yoy: ty, yoyBase: tyb, vsM: tv, vsMBase: tvb });
    return rows;
  }

  const mthRows  = buildMthRows();
  const mthTotal = mthRows.find(r => !r.areaKey)!;
  const qtrRows  = buildQtrRows();
  const qtrTotal = qtrRows.find(r => !r.areaKey)!;
  const isCurrentMonth = selMthYear === curY && selMth === curM;

  // Select-input styling reused for both period pickers
  const selectCls = "appearance-none text-sm font-medium border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-slate-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300/60 cursor-pointer bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[length:12px_12px] bg-[position:right_10px_center]";

  return (
    <div className="space-y-10">

      {/* ── Page heading with inline Closed Won stat ─ */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isCurrentMonth
              ? <>Live snapshot for <span className="font-medium text-slate-700">{mthLabel}</span> across all areas.</>
              : <>Historical snapshot for <span className="font-medium text-slate-700">{mthLabel}</span>.</>}
          </p>
        </div>
        <div className="flex items-stretch gap-6 bg-white/70 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-card px-5 py-3">
          <div className="text-right">
            <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
              Closed Won · {mthLabel}
            </p>
            <p className="mt-1 text-[28px] leading-none font-bold tabular-nums tracking-tight text-slate-900">
              {fmtK(mthTotal.cw)}
            </p>
          </div>
          <div className="w-px bg-gray-200/80" aria-hidden="true" />
          <div className="text-right">
            <p className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
              Closed Won · {qtrLabel}
            </p>
            <p className="mt-1 text-[28px] leading-none font-bold tabular-nums tracking-tight text-slate-900">
              {fmtK(qtrTotal.cw)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Month section ───────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-base font-semibold text-slate-900">{mthLabel}</h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Results</span>
          </div>
          <select
            value={`${selMthYear}-${selMth}`}
            onChange={e => { const [y, m] = e.target.value.split('-').map(Number); setSelMthYear(y); setSelMth(m); }}
            className={selectCls}
          >
            {monthOptions.map(({ year, month }) => {
              const label = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
              return <option key={`${year}-${month}`} value={`${year}-${month}`}>{label}</option>;
            })}
          </select>
        </div>
        <ResultsTable key={mthKey} rows={mthRows} onAreaClick={onAreaClick} period={mthKey} comments={buildCommentMap(mthKey)} />
      </div>

      {/* ── Quarter section ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-base font-semibold text-slate-900">{qtrLabel}</h2>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Quarterly Results</span>
          </div>
          <select
            value={`${selQtrYear}-${selQtr}`}
            onChange={e => { const [y, q] = e.target.value.split('-').map(Number); setSelQtrYear(y); setSelQtr(q); }}
            className={selectCls}
          >
            {qtrOptions.map(({ year, quarter }) => (
              <option key={`${year}-${quarter}`} value={`${year}-${quarter}`}>Q{quarter} {year}</option>
            ))}
          </select>
        </div>
        <ResultsTable key={qtrKey} rows={qtrRows} onAreaClick={onAreaClick} period={qtrKey} comments={buildCommentMap(qtrKey)} />
      </div>

    </div>
  );
}
