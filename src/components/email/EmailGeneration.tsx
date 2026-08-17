import { useState } from 'react';
import MobileBillAllowanceForm from './MobileBillAllowanceForm';
import FundTransferForm from './FundTransferForm';

type LetterType = 'mobile-bill-allowance' | 'fund-transfer';

const LETTER_TYPES: Array<{ id: LetterType; label: string }> = [
  { id: 'mobile-bill-allowance', label: 'Mobile Bill Allowance' },
  { id: 'fund-transfer', label: 'Fund Transfer Request' },
];

export default function EmailGeneration() {
  const [letterType, setLetterType] = useState<LetterType>('mobile-bill-allowance');

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-letter { border: none !important; box-shadow: none !important; padding: 0 !important; }
          .print-letter textarea { border: none !important; resize: none !important; }
        }
      `}</style>

      <div className="no-print flex gap-1.5">
        {LETTER_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setLetterType(t.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              letterType === t.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {letterType === 'mobile-bill-allowance' && <MobileBillAllowanceForm />}
      {letterType === 'fund-transfer' && <FundTransferForm />}
    </div>
  );
}
