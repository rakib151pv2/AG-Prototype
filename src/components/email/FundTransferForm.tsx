import { useState } from 'react';
import { amountToTakaWords } from '../../numberToWords';
import { GROUP_ENTITIES, SIGNATORIES, suggestReference } from '../../letters/shared';
import {
  accountDisplayName,
  buildFundTransferBody,
  buildFundTransferSubject,
  entityShortNameFor,
  KNOWN_ACCOUNTS,
} from '../../letters/fundTransferTemplate';
import LetterShell, { today } from './LetterShell';

const inputClass =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

const DEFAULT_FROM_ID = 'icml-main';
const DEFAULT_TO_ID = 'itml-central';

export default function FundTransferForm() {
  const [fromAccountId, setFromAccountId] = useState(DEFAULT_FROM_ID);
  const [toAccountId, setToAccountId] = useState(DEFAULT_TO_ID);
  const [letterDate, setLetterDate] = useState(today());
  const [refSeq, setRefSeq] = useState('001');
  const [amount, setAmount] = useState('');
  const [signatoryIndex, setSignatoryIndex] = useState(0);

  const fromAccount = KNOWN_ACCOUNTS.find((a) => a.id === fromAccountId) ?? KNOWN_ACCOUNTS[0];
  const toAccount = KNOWN_ACCOUNTS.find((a) => a.id === toAccountId) ?? KNOWN_ACCOUNTS[1];
  const fromEntity = GROUP_ENTITIES.find((e) => e.id === fromAccount.entityId);
  const signatory = SIGNATORIES[signatoryIndex];
  const amountNum = Number(amount) || 0;

  function templateParams() {
    return {
      fromEntityName: entityShortNameFor(fromAccount),
      fromAccountNo: fromAccount.accountNo,
      toEntityName: entityShortNameFor(toAccount),
      toAccountNo: toAccount.accountNo,
      amount: amountNum,
    };
  }

  const [refNumber, setRefNumber] = useState(suggestReference(fromEntity?.refPrefix ?? '', letterDate, refSeq, 'FT'));
  const [subject, setSubject] = useState(buildFundTransferSubject(templateParams()));
  const [body, setBody] = useState(buildFundTransferBody(templateParams()));

  function handleGenerate() {
    setRefNumber(suggestReference(fromEntity?.refPrefix ?? '', letterDate, refSeq, 'FT'));
    setSubject(buildFundTransferSubject(templateParams()));
    setBody(buildFundTransferBody(templateParams()));
  }

  return (
    <div className="space-y-4">
      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Transfer Accounts</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">From Account</label>
              <select className={inputClass} value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
                {KNOWN_ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountDisplayName(a)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">To Account</label>
              <select className={inputClass} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                {KNOWN_ACCOUNTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountDisplayName(a)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Amount (TK.)</label>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {amountNum > 0 && <p className="mt-1 text-xs text-slate-400">In words: {amountToTakaWords(amountNum)}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Reference &amp; Signatory</h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Letter Date</label>
                <input
                  className={inputClass}
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ref. Serial No.</label>
                <input className={inputClass} value={refSeq} onChange={(e) => setRefSeq(e.target.value)} placeholder="001" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ref. Prefix (from source entity)</label>
              <input className={inputClass} value={fromEntity?.refPrefix ?? ''} disabled />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Signatory</label>
              <select
                className={inputClass}
                value={signatoryIndex}
                onChange={(e) => setSignatoryIndex(Number(e.target.value))}
              >
                {SIGNATORIES.map((s, i) => (
                  <option key={`${s.name}-${s.title}`} value={i}>
                    {s.name} — {s.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Generate Letter
            </button>
          </div>
        </div>
      </div>

      <LetterShell
        letterDate={letterDate}
        refNumber={refNumber}
        subject={subject}
        body={body}
        onBodyChange={setBody}
        signatory={signatory}
        closing={
          <>
            <p className="mt-4">Your Co-operation in this regard will be highly appreciated.</p>
            <p className="mt-4">Best regards.</p>
          </>
        }
      />
    </div>
  );
}
