import { useState } from 'react';
import { allHistoryDates, yesterdayIso } from '../../../yarnCosting/sampleDailyData';
import { iso } from '../../../dateUtil';

export type RangePreset = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Last Month' | 'Custom';

const PRESETS: RangePreset[] = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month', 'Custom'];

export function resolveDates(preset: RangePreset, customFrom: string, customTo: string): string[] {
  const all = allHistoryDates();
  const today = iso(0);
  const yesterday = yesterdayIso();

  if (preset === 'Today') return all.filter((d) => d === today);
  if (preset === 'Yesterday') return all.filter((d) => d === yesterday);

  if (preset === 'This Week') {
    const d = new Date(yesterday);
    const dayOfWeek = d.getDay();
    const from = iso(-1 - dayOfWeek);
    return all.filter((d2) => d2 >= from && d2 <= yesterday);
  }

  if (preset === 'This Month') {
    const monthPrefix = yesterday.slice(0, 7);
    return all.filter((d2) => d2.startsWith(monthPrefix));
  }

  if (preset === 'Last Month') {
    const d = new Date(yesterday);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    const monthPrefix = d.toISOString().slice(0, 7);
    return all.filter((d2) => d2.startsWith(monthPrefix));
  }

  // Custom
  return all.filter((d2) => (!customFrom || d2 >= customFrom) && (!customTo || d2 <= customTo));
}

export default function DateRangeFilter({
  preset,
  customFrom,
  customTo,
  onChange,
}: {
  preset: RangePreset;
  customFrom: string;
  customTo: string;
  onChange: (preset: RangePreset, customFrom: string, customTo: string) => void;
}) {
  const [localFrom, setLocalFrom] = useState(customFrom);
  const [localTo, setLocalTo] = useState(customTo);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p, localFrom, localTo)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            preset === p ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {p}
        </button>
      ))}
      {preset === 'Custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
            value={localFrom}
            onChange={(e) => {
              setLocalFrom(e.target.value);
              onChange('Custom', e.target.value, localTo);
            }}
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
            value={localTo}
            onChange={(e) => {
              setLocalTo(e.target.value);
              onChange('Custom', localFrom, e.target.value);
            }}
          />
        </div>
      )}
    </div>
  );
}
