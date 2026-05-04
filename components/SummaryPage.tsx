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

// ─── Inline comment row ───────────────────────────────────────────────────────

function CommentRow({ period, areaKey, initial }: {
  period:  string;
  areaKey: string;
  initial: string;
}) {
  const [draft,   setDraft]   = useState(initial);
  const [saved,   setSaved]   = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);

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
    <tr className="bg-gray-50/30 border-b border-gray-100">
      <td colSpan={6} className="px-5 py-2">
        {editing ? (
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
              placeholder="Add commentary…"
              className="flex-1 text-sm border border-gray-200 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-slate-700 placeholder-gray-300"
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={() => { setDraft(saved); setEditing(false); }}
                className="px-3 py-1 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p
            onClick={() => setEditing(true)}
            className="text-sm cursor-text min-h-[1.75rem] py-0.5 transition-colors"
          >
            {saved
              ? <span className="text-slate-500 hover:text-slate-700">{saved}</span>
              : <span className="text-gray-300 italic text-xs hover:text-gray-400">Add commentary…</span>}
          </p>
        )}
      </td>
    </tr>
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

interface ResultsTableProps {
  rows:        RowData[];
  onAreaClick: (area: AreaKey) => void;
  period:      string;
  comments:    Record<string, string>;
}

function ResultsTable({ rows, onAreaClick, period, comments }: ResultsTableProps) {
  const totalRow = rows.find(r => !r.areaKey)!;
  const areaRows = rows.filter(r => !!r.areaKey);

  function DataRow({ row, stripe }: { row: RowData; stripe: boolean }) {
    const isTotal = !row.areaKey;
    return (
      <tr
        onClick={() => row.areaKey && onAreaClick(row.areaKey)}
        className={`transition-colors ${
          isTotal
            ? 'bg-gray-50 font-bold'
            : `cursor-pointer hover:bg-blue-50/30 ${stripe ? 'bg-gray-50/40' : 'bg-white'}`
        }`}
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
          <span className="text-gray-300 text-xs italic">TBC</span>
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
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#1e3a5f' }} className="text-white">
              <th className="px-5 py-3.5 text-left font-semibold text-xs uppercase tracking-wide">Area</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">Closed Won</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">SD Forecast</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">WoW</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">YoY</th>
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">vs Forecast</th>
            </tr>
          </thead>
          <tbody>
            {/* Total first */}
            <DataRow row={totalRow} stripe={false} />
            <CommentRow period={period} areaKey="total" initial={comments['total'] ?? ''} />

            {/* Area rows */}
            {areaRows.map((row, i) => (
              <>
                <DataRow key={row.label} row={row} stripe={i % 2 !== 0} />
                <CommentRow
                  key={`${row.areaKey}-comment`}
                  period={period}
                  areaKey={row.areaKey!}
                  initial={comments[row.areaKey!] ?? ''}
                />
              </>
            ))}
          </tbody>
        </table>
      </div>
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
    const keys = [...AREAS.map(a => a.key), 'total'];
    for (const key of keys) {
      const entry = overviewComments.find(c => c.period === `${periodPrefix}:${key}`);
      map[key] = entry?.comment ?? '';
    }
    return map;
  }

  const mthComments = buildCommentMap(mthKey);
  const qtrComments = buildCommentMap(qtrKey);

  function buildMthRows(): RowData[] {
    const rows: RowData[] = [];
    for (const area of AREAS) {
      const twArea = allThisWeek.filter(d => d.area === area.key);
      const lwArea = allLastWeek.filter(d => d.area === area.key);
      const cw      = closedWon(filterMonth(twArea, selMthYear, selMth));
      const lwCw    = closedWon(filterMonth(lwArea, selMthYear, selMth));
      const priorCw = closedWon(filterMonth(twArea, selMthYear, selMth, -1));
      const sd       = sdForecasts.find(f => f.area === area.key);
      const sdTarget = sd ? sd.month.closedWon + sd.month.commit : null;
      rows.push({
        label: area.label, areaKey: area.key, accentColor: area.accentColor,
        cw, sdForecast: null,
        wow: cw - lwCw, wowBase: lwCw,
        yoy: priorCw > 0 || cw > 0 ? cw - priorCw : null,
        yoyBase: priorCw > 0 ? priorCw : null,
        vsM: sdTarget !== null ? cw - sdTarget : null, vsMBase: sdTarget,
      });
    }
    const tc = rows.reduce((s, r) => s + r.cw, 0);
    const tw = rows.reduce((s, r) => s + r.wow, 0);
    const twb = rows.reduce((s, r) => s + r.wowBase, 0);
    const ay = rows.some(r => r.yoy !== null);
    const ty = ay ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const tyb = ay ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const av = rows.some(r => r.vsM !== null);
    const tv = av ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const tvb = av ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;
    rows.push({ label: 'Total', cw: tc, sdForecast: null, wow: tw, wowBase: twb, yoy: ty, yoyBase: tyb, vsM: tv, vsMBase: tvb });
    return rows;
  }

  function buildQtrRows(): RowData[] {
    const rows: RowData[] = [];
    for (const area of AREAS) {
      const twArea = allThisWeek.filter(d => d.area === area.key);
      const lwArea = allLastWeek.filter(d => d.area === area.key);
      const cw      = closedWon(filterQuarter(twArea, selQtrYear, selQtr));
      const lwCw    = closedWon(filterQuarter(lwArea, selQtrYear, selQtr));
      const priorCw = closedWon(filterQuarter(twArea, selQtrYear, selQtr, -1));
      const sd       = sdForecasts.find(f => f.area === area.key);
      const sdTarget = sd ? sd.quarter.closedWon + sd.quarter.commit : null;
      rows.push({
        label: area.label, areaKey: area.key, accentColor: area.accentColor,
        cw, sdForecast: null,
        wow: cw - lwCw, wowBase: lwCw,
        yoy: priorCw > 0 || cw > 0 ? cw - priorCw : null,
        yoyBase: priorCw > 0 ? priorCw : null,
        vsM: sdTarget !== null ? cw - sdTarget : null, vsMBase: sdTarget,
      });
    }
    const tc = rows.reduce((s, r) => s + r.cw, 0);
    const tw = rows.reduce((s, r) => s + r.wow, 0);
    const twb = rows.reduce((s, r) => s + r.wowBase, 0);
    const ay = rows.some(r => r.yoy !== null);
    const ty = ay ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const tyb = ay ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const av = rows.some(r => r.vsM !== null);
    const tv = av ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const tvb = av ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;
    rows.push({ label: 'Total', cw: tc, sdForecast: null, wow: tw, wowBase: twb, yoy: ty, yoyBase: tyb, vsM: tv, vsMBase: tvb });
    return rows;
  }

  function handleMthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [y, m] = e.target.value.split('-').map(Number);
    setSelMthYear(y); setSelMth(m);
  }

  function handleQtrChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [y, q] = e.target.value.split('-').map(Number);
    setSelQtrYear(y); setSelQtr(q);
  }

  return (
    <div className="space-y-8">

      {/* ── Month section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">{mthLabel} Results</h2>
          <select
            value={`${selMthYear}-${selMth}`}
            onChange={handleMthChange}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            {monthOptions.map(({ year, month }) => {
              const label = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
              return <option key={`${year}-${month}`} value={`${year}-${month}`}>{label}</option>;
            })}
          </select>
        </div>
        <ResultsTable
          key={mthKey}
          rows={buildMthRows()}
          onAreaClick={onAreaClick}
          period={mthKey}
          comments={mthComments}
        />
      </div>

      {/* ── Quarter section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">{qtrLabel} Results</h2>
          <select
            value={`${selQtrYear}-${selQtr}`}
            onChange={handleQtrChange}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            {qtrOptions.map(({ year, quarter }) => (
              <option key={`${year}-${quarter}`} value={`${year}-${quarter}`}>Q{quarter} {year}</option>
            ))}
          </select>
        </div>
        <ResultsTable
          key={qtrKey}
          rows={buildQtrRows()}
          onAreaClick={onAreaClick}
          period={qtrKey}
          comments={qtrComments}
        />
      </div>

    </div>
  );
}
