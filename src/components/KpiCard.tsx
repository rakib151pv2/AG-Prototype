import type { LucideIcon } from 'lucide-react';

export default function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: 'default' | 'danger' | 'warning';
}) {
  const toneClasses = {
    default: 'text-slate-500 bg-slate-100',
    danger: 'text-red-600 bg-red-50',
    warning: 'text-amber-600 bg-amber-50',
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`rounded-md p-1.5 ${toneClasses}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
