import type { ScrutinyStatus } from '../../lcScrutiny/types';

const COLORS: Record<ScrutinyStatus, { bg: string; text: string; dot: string }> = {
  Clean: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Discrepancy Found': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function ScrutinyStatusBadge({ status }: { status: ScrutinyStatus }) {
  const c = COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
