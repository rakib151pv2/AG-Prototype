import { useMemo } from 'react';
import { AlertTriangle, Bell, Clock } from 'lucide-react';
import type { LC } from '../types';
import { getAccruedInterestBDT, getDaysOverdue, getDaysToMaturity, getStatus } from '../selectors';
import { formatBDT } from '../formatters';

type Alert = {
  id: string;
  lc: LC;
  kind: 'overdue' | 'due-soon';
  message: string;
};

export default function Alerts({ lcs }: { lcs: LC[] }) {
  const alerts = useMemo(() => {
    const today = new Date();
    const list: Alert[] = [];

    for (const lc of lcs) {
      const status = getStatus(lc, today);
      if (status === 'Overdue') {
        const days = getDaysOverdue(lc, today);
        const interest = getAccruedInterestBDT(lc, today);
        list.push({
          id: `${lc.id}-overdue`,
          lc,
          kind: 'overdue',
          message: `LC #${lc.lcNumber} overdue by ${days} day${days === 1 ? '' : 's'}, ~${formatBDT(interest)} interest accruing`,
        });
      } else if (status === 'Due Soon') {
        const days = getDaysToMaturity(lc, today);
        list.push({
          id: `${lc.id}-due-soon`,
          lc,
          kind: 'due-soon',
          message:
            days === 0
              ? `LC #${lc.lcNumber} matures today`
              : `LC #${lc.lcNumber} matures in ${days} day${days === 1 ? '' : 's'}`,
        });
      }
    }

    return list.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'overdue' ? -1 : 1;
      if (a.kind === 'overdue') {
        return getDaysOverdue(b.lc, today) - getDaysOverdue(a.lc, today);
      }
      return getDaysToMaturity(a.lc, today) - getDaysToMaturity(b.lc, today);
    });
  }, [lcs]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <Bell size={16} className="text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700">Alerts</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {alerts.length}
        </span>
      </div>
      <p className="px-4 pt-3 text-xs text-slate-500">
        Auto-generated from maturity and realization status — stands in for the proposed email/SMS alert engine.
      </p>

      <div className="divide-y divide-slate-100 px-4 pb-2">
        {alerts.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No active alerts. Portfolio is current.</p>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-3 py-3">
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                a.kind === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {a.kind === 'overdue' ? <AlertTriangle size={14} /> : <Clock size={14} />}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-700">{a.message}</p>
              <p className="text-xs text-slate-500">
                {a.lc.beneficiary} · {a.lc.unit} · Responsible: {a.lc.responsiblePerson}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
