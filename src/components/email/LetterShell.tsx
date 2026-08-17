import type { ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { BANK_RECIPIENT_LINES, type Signatory } from '../../letters/shared';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatLetterDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export { today };

export default function LetterShell({
  letterDate,
  refNumber,
  subject,
  body,
  onBodyChange,
  signatory,
  closing,
  footer,
}: {
  letterDate: string;
  refNumber: string;
  subject: string;
  body: string;
  onBodyChange: (value: string) => void;
  signatory: Signatory;
  closing: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="print-letter mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8">
      <div className="no-print mb-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Printer size={15} />
          Print Letter
        </button>
      </div>

      <div className="font-serif text-sm leading-relaxed text-slate-800">
        <p className="text-right">{formatLetterDate(letterDate)}</p>
        <p className="mt-4">Ref: {refNumber}</p>

        <div className="mt-4">
          {BANK_RECIPIENT_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <p className="mt-4">
          <span className="font-semibold">Subject: </span>
          {subject}
        </p>

        <p className="mt-4">Dear Sir,</p>

        <textarea
          className="mt-3 h-56 w-full resize-y whitespace-pre-wrap rounded-md border border-slate-200 p-2 font-serif text-sm leading-relaxed text-slate-800"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
        />

        {closing}

        <div className="mt-14">
          <p>{signatory.parenthesize ? `(${signatory.name})` : signatory.name}</p>
          <p>{signatory.title}</p>
        </div>

        {footer && <div className="mt-10 text-xs text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}
