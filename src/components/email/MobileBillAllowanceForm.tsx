import { useState } from 'react';
import { amountToTakaWords } from '../../numberToWords';
import { GROUP_ENTITIES, MONTH_NAMES, SIGNATORIES, suggestReference } from '../../letters/shared';
import {
  buildBody,
  buildEnclosureLine,
  buildSubject,
  type AllowanceType,
  type DisbursementMode,
} from '../../letters/mobileBillLetterTemplate';
import LetterShell, { today } from './LetterShell';

const inputClass =
  'w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500';

export default function MobileBillAllowanceForm() {
  const [entityId, setEntityId] = useState(GROUP_ENTITIES[0].id);
  const [cdAccountNo, setCdAccountNo] = useState(GROUP_ENTITIES[0].cdAccountNo);
  const [letterDate, setLetterDate] = useState(today());
  const [refSeq, setRefSeq] = useState('001');
  const [allowanceType, setAllowanceType] = useState<AllowanceType>('regular');
  const [mode, setMode] = useState<DisbursementMode>('bulk');
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth());
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [singleEmployeeName, setSingleEmployeeName] = useState('');
  const [singleEmployeeAccount, setSingleEmployeeAccount] = useState('');
  const [signatoryIndex, setSignatoryIndex] = useState(0);

  const entity = GROUP_ENTITIES.find((e) => e.id === entityId) ?? GROUP_ENTITIES[0];
  const signatory = SIGNATORIES[signatoryIndex];
  const periodLabel = `${MONTH_NAMES[periodMonth]}- ${periodYear}`;
  const amountNum = Number(amount) || 0;

  const [refNumber, setRefNumber] = useState(suggestReference(entity.refPrefix, letterDate, refSeq));
  const [subject, setSubject] = useState(buildSubject({ allowanceType, periodLabel }));
  const [body, setBody] = useState(
    buildBody({
      entityName: entity.name,
      cdAccountNo: entity.cdAccountNo,
      allowanceType,
      mode,
      periodLabel,
      amount: amountNum,
      employeeCount,
      singleEmployeeName,
      singleEmployeeAccount,
    })
  );

  function handleEntityChange(id: string) {
    setEntityId(id);
    const next = GROUP_ENTITIES.find((e) => e.id === id) ?? GROUP_ENTITIES[0];
    setCdAccountNo(next.cdAccountNo);
  }

  function handleGenerate() {
    setRefNumber(suggestReference(entity.refPrefix, letterDate, refSeq));
    setSubject(buildSubject({ allowanceType, periodLabel }));
    setBody(
      buildBody({
        entityName: entity.name,
        cdAccountNo,
        allowanceType,
        mode,
        periodLabel,
        amount: amountNum,
        employeeCount,
        singleEmployeeName,
        singleEmployeeAccount,
      })
    );
  }

  const enclosureLine = buildEnclosureLine({
    mode,
    entityName: entity.name,
    employeeCount,
    singleEmployeeName,
    singleEmployeeAccount,
  });

  return (
    <div className="space-y-4">
      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Entity &amp; Reference</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Group Entity</label>
              <select className={inputClass} value={entityId} onChange={(e) => handleEntityChange(e.target.value)}>
                {GROUP_ENTITIES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">CD Account No.</label>
              <input className={inputClass} value={cdAccountNo} onChange={(e) => setCdAccountNo(e.target.value)} />
            </div>
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
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Disbursement Details</h3>
          <div className="mt-3 space-y-3">
            <div className="flex gap-1.5">
              <button
                onClick={() => setAllowanceType('regular')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  allowanceType === 'regular' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Regular
              </button>
              <button
                onClick={() => setAllowanceType('supplementary')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  allowanceType === 'supplementary' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Supplementary
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setMode('bulk')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  mode === 'bulk' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All Employees
              </button>
              <button
                onClick={() => setMode('single')}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  mode === 'single' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Single Employee
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Allowance Month</label>
                <select className={inputClass} value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))}>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Allowance Year</label>
                <input
                  className={inputClass}
                  type="number"
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Amount (TK.)</label>
              <input className={inputClass} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              {amountNum > 0 && <p className="mt-1 text-xs text-slate-400">In words: {amountToTakaWords(amountNum)}</p>}
            </div>

            {mode === 'bulk' ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Number of Employees</label>
                <input className={inputClass} type="number" min="0" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Employee Name</label>
                  <input className={inputClass} value={singleEmployeeName} onChange={(e) => setSingleEmployeeName(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Employee A/C No.</label>
                  <input className={inputClass} value={singleEmployeeAccount} onChange={(e) => setSingleEmployeeAccount(e.target.value)} />
                </div>
              </div>
            )}

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
          <p className="mt-4">
            Your Co-operation in this regard will be highly appreciated.
            <br />
            Thanking You.
          </p>
        }
        footer={<p className="whitespace-pre-line">{enclosureLine}</p>}
      />
    </div>
  );
}
