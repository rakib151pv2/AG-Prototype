import { useMemo } from 'react';
import type { LoanFacility, LoanType } from '../../types';
import { getLoanOutstandingBDT, getLoanStatus } from '../../loanSelectors';
import { formatBDT } from '../../formatters';

const LOAN_TYPE_ORDER: LoanType[] = ['STL', 'UPAS', 'OD', 'EDF'];

export default function LoanUnitMatrix({ loans }: { loans: LoanFacility[] }) {
  const rows = useMemo(() => {
    const today = new Date();
    const units = Array.from(new Set(loans.map((l) => l.unit))).sort();

    return units.map((unit) => {
      const unitLoans = loans.filter((l) => l.unit === unit);
      const byType = LOAN_TYPE_ORDER.map((type) => {
        const typeLoans = unitLoans.filter((l) => l.loanType === type);
        return {
          type,
          count: typeLoans.length,
          outstandingBDT: typeLoans.reduce((s, l) => s + getLoanOutstandingBDT(l), 0),
          hasOverdue: typeLoans.some((l) => getLoanStatus(l, today) === 'Overdue'),
        };
      });
      return {
        unit,
        byType,
        totalOutstanding: byType.reduce((s, t) => s + t.outstandingBDT, 0),
        overdueCount: unitLoans.filter((l) => getLoanStatus(l, today) === 'Overdue').length,
      };
    });
  }, [loans]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-700">Outstanding by Unit &amp; Facility Type</h3>
      <p className="text-xs text-slate-500">Each unit's exposure across its STL / UPAS / OD / EDF facilities</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="py-2 pr-4 font-medium">Unit</th>
              {LOAN_TYPE_ORDER.map((t) => (
                <th key={t} className="px-3 py-2 text-right font-medium">
                  {t}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total Outstanding</th>
              <th className="pl-3 py-2 text-right font-medium">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.unit}>
                <td className="max-w-[220px] truncate py-2.5 pr-4 font-medium text-slate-700">{r.unit}</td>
                {r.byType.map((t) => (
                  <td
                    key={t.type}
                    className={`px-3 py-2.5 text-right tabular-nums ${
                      t.hasOverdue ? 'font-medium text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {t.count === 0 ? '—' : formatBDT(t.outstandingBDT)}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                  {formatBDT(r.totalOutstanding)}
                </td>
                <td className="pl-3 py-2.5 text-right">
                  {r.overdueCount > 0 ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      {r.overdueCount}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={LOAN_TYPE_ORDER.length + 3} className="py-8 text-center text-sm text-slate-400">
                  No facilities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
