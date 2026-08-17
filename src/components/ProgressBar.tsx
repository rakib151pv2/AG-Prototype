export default function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = clamped >= 100 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-sky-500' : 'bg-slate-400';
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 flex-1 rounded-full bg-slate-200">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-500 w-9 text-right">{clamped.toFixed(0)}%</span>
    </div>
  );
}
