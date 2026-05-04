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

function pctThroughMonth(year: number, month: number): number {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  if (year < curY || (year === curY && month < curM)) return 100;
  if (year > curY || (year === curY && month > curM)) return 0;
  const days = new Date(year, month, 0).getDate();
  return Math.round((now.getDate() / days) * 100);
}

function pctThroughQuarter(year: number, quarter: number): number {
  const now = new Date();
  const curY = now.getFullYear();
  const curQ = Math.ceil((now.getMonth() + 1) / 3);
  if (year < curY || (year === curY && quarter < curQ)) return 100;
  if (year > curY || (year === curY && quarter > curQ)) return 0;
  const startM = (quarter - 1) * 3;
  const endM   = quarter * 3 - 1;
  const qStart = new Date(year, startM, 1);
  const qEnd   = new Date(year, endM + 1, 0);
  const total   = Math.round((qEnd.getTime() - qStart.getTime()) / 86_400_000) + 1;
  const elapsed = Math.round((now.getTime() - qStart.getTime()) / 86_400_000) + 1;
  return Math.min(100, Math.round((elapsed / total) * 100));
}

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

// ─── Area comment box ─────────────────────────────────────────────────────────

function AreaCommentBox({
  period,
  initialComments,
  initialUpdatedAts,
}: {
  period: string;
  initialComments: Record<string, string>;
  initialUpdatedAts: Record<string, string>;
}) {
  const initDrafts: Record<string, string> = {};
  for (const a of AREAS) initDrafts[a.key] = initialComments[a.key] ?? '';

  const [drafts,    setDrafts]    = useState(initDrafts);
  const [saved,     setSaved]     = useState(initDrafts);
  const [isEditing, setIsEditing] = useState(() => AREAS.every(a => !initialComments[a.key]));
  const [saving,    setSaving]    = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(() => {
    const dates = Object.values(initialUpdatedAts).filter(Boolean).sort();
    return dates.at(-1);
  });

  async function submit() {
    setSaving(true);
    try {
      await Promise.all(
        AREAS.map(a =>
          fetch('/api/overview-comment', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ period: `${period}:${a.key}`, comment: drafts[a.key] }),
          })
        )
      );
      setSaved({ ...drafts });
      setLastSavedAt(new Date().toISOString());
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDrafts({ ...saved });
    setIsEditing(false);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Commentary</span>
        {lastSavedAt && (
          <span className="text-xs text-gray-400">Last saved: {fmtDate(lastSavedAt)}</span>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {AREAS.map(area => (
          <div key={area.key} className="px-5 py-3 flex items-start gap-4">
            <div className="flex items-center gap-2 w-40 shrink-0 pt-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: area.accentColor }} />
              <span className="text-sm font-medium text-slate-700">{area.label}</span>
            </div>
            {isEditing ? (
              <textarea
                value={drafts[area.key]}
                onChange={e => setDrafts(prev => ({ ...prev, [area.key]: e.target.value }))}
                rows={2}
                placeholder={`Add commentary for ${area.label}…`}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-slate-700 placeholder-gray-300"
              />
            ) : (
              <p className="flex-1 text-sm text-slate-600 pt-2 min-h-[2.5rem]">
                {saved[area.key] || <span className="text-gray-300 italic">No commentary</span>}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50">
        {isEditing ? (
          <>
            <button
              onClick={cancel}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !saving ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
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

interface ResultsTableProps {
  rows:        RowData[];
  onAreaClick: (area: AreaKey) => void;
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
              <th className="px-5 py-3.5 text-right font-semibold text-xs uppercase tracking-wide">SD Forecast</th>
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
  const now   = new Date();
  const curY  = now.getFullYear();
  const curM  = now.getMonth() + 1;
  const curQ  = Math.ceil(curM / 3);

  const [selMthYear,  setSelMthYear]  = useState(curY);
  const [selMth,      setSelMth]      = useState(curM);
  const [selQtrYear,  setSelQtrYear]  = useState(curY);
  const [selQtr,      setSelQtr]      = useState(curQ);

  // Generate month options — current + 11 prior months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(curY, curM - 1 - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  // Generate quarter options — current + 7 prior quarters
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

  function buildCommentMaps(periodPrefix: string): [Record<string, string>, Record<string, string>] {
    const comments:   Record<string, string> = {};
    const updatedAts: Record<string, string> = {};
    for (const a of AREAS) {
      const key   = `${periodPrefix}:${a.key}`;
      const entry = overviewComments.find(c => c.period === key);
      comments[a.key]   = entry?.comment   ?? '';
      updatedAts[a.key] = entry?.updatedAt ?? '';
    }
    return [comments, updatedAts];
  }

  const [mthComments, mthUpdatedAts] = buildCommentMaps(mthKey);
  const [qtrComments, qtrUpdatedAts] = buildCommentMaps(qtrKey);

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
        vsM: sdTarget !== null ? cw - sdTarget : null,
        vsMBase: sdTarget,
      });
    }
    const totalCw   = rows.reduce((s, r) => s + r.cw, 0);
    const totalWow  = rows.reduce((s, r) => s + r.wow, 0);
    const totalWowB = rows.reduce((s, r) => s + r.wowBase, 0);
    const anyYoy    = rows.some(r => r.yoy !== null);
    const totalYoy  = anyYoy ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const totalYoyB = anyYoy ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const anyVsM    = rows.some(r => r.vsM !== null);
    const totalVsM  = anyVsM ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const totalVsMB = anyVsM ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;
    rows.push({ label: 'Total', cw: totalCw, sdForecast: null, wow: totalWow, wowBase: totalWowB, yoy: totalYoy, yoyBase: totalYoyB, vsM: totalVsM, vsMBase: totalVsMB });
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
        vsM: sdTarget !== null ? cw - sdTarget : null,
        vsMBase: sdTarget,
      });
    }
    const totalCw   = rows.reduce((s, r) => s + r.cw, 0);
    const totalWow  = rows.reduce((s, r) => s + r.wow, 0);
    const totalWowB = rows.reduce((s, r) => s + r.wowBase, 0);
    const anyYoy    = rows.some(r => r.yoy !== null);
    const totalYoy  = anyYoy ? rows.reduce((s, r) => s + (r.yoy ?? 0), 0) : null;
    const totalYoyB = anyYoy ? rows.reduce((s, r) => s + (r.yoyBase ?? 0), 0) : null;
    const anyVsM    = rows.some(r => r.vsM !== null);
    const totalVsM  = anyVsM ? rows.reduce((s, r) => s + (r.vsM ?? 0), 0) : null;
    const totalVsMB = anyVsM ? rows.reduce((s, r) => s + (r.vsMBase ?? 0), 0) : null;
    rows.push({ label: 'Total', cw: totalCw, sdForecast: null, wow: totalWow, wowBase: totalWowB, yoy: totalYoy, yoyBase: totalYoyB, vsM: totalVsM, vsMBase: totalVsMB });
    return rows;
  }

  function handleMthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [y, m] = e.target.value.split('-').map(Number);
    setSelMthYear(y);
    setSelMth(m);
  }

  function handleQtrChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [y, q] = e.target.value.split('-').map(Number);
    setSelQtrYear(y);
    setSelQtr(q);
  }

  return (
    <div className="space-y-8">

      {/* ── Month section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionHeader title={`${mthLabel} Results`} pct={pctThroughMonth(selMthYear, selMth)} unit="month" />
          <select
            value={`${selMthYear}-${selMth}`}
            onChange={handleMthChange}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
          >
            {monthOptions.map(({ year, month }) => {
              const label = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
              return (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>{label}</option>
              );
            })}
          </select>
        </div>
        <ResultsTable rows={buildMthRows()} onAreaClick={onAreaClick} />
        <AreaCommentBox
          key={mthKey}
          period={mthKey}
          initialComments={mthComments}
          initialUpdatedAts={mthUpdatedAts}
        />
      </div>

      {/* ── Quarter section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionHeader title={`${qtrLabel} Results`} pct={pctThroughQuarter(selQtrYear, selQtr)} unit="qtr" />
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
        <ResultsTable rows={buildQtrRows()} onAreaClick={onAreaClick} />
        <AreaCommentBox
          key={qtrKey}
          period={qtrKey}
          initialComments={qtrComments}
          initialUpdatedAts={qtrUpdatedAts}
        />
      </div>

    </div>
  );
}
