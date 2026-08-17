import type { LoanStatus } from '../../types';
import { LOAN_STATUS_COLORS } from '../../loanSelectors';

export default function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const c = LOAN_STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}
