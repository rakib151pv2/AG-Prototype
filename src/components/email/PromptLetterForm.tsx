import { useRef, useState, type ReactNode } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { GROUP_ENTITIES, MONTH_NAMES, SIGNATORIES, suggestReference, type Signatory } from '../../letters/shared';
import {
  KNOWN_ACCOUNTS,
  accountDisplayName,
  buildFundTransferBody,
  buildFundTransferSubject,
  entityShortNameFor,
} from '../../letters/fundTransferTemplate';
import { buildBody, buildEnclosureLine, buildSubject } from '../../letters/mobileBillLetterTemplate';
import {
  detectLetterType,
  getMissingFundTransferFields,
  getMissingMobileBillFields,
  parseFundTransferPrompt,
  parseMobileBillPrompt,
  type FieldSpec,
  type PromptLetterType,
  type ResolvedFundTransfer,
  type ResolvedMobileBill,
} from '../../letters/promptParsing';
import LetterShell, { today } from './LetterShell';

type ChatTurn = { role: 'user' | 'assistant'; text: string };
type Stage = 'input' | 'clarify' | 'done';

type LetterMeta = {
  letterDate: string;
  refNumber: string;
  subject: string;
  signatory: Signatory;
  closing: ReactNode;
  footer?: ReactNode;
};

const LETTER_TYPE_FIELD: FieldSpec = {
  key: 'letterType',
  label: 'Which kind of letter is this?',
  kind: 'select',
  options: [
    { value: 'mobile-bill-allowance', label: 'Mobile Bill Allowance' },
    { value: 'fund-transfer', label: 'Fund Transfer Request' },
  ],
};

const EMPTY_MOBILE: ResolvedMobileBill = { year: new Date().getFullYear(), allowanceType: 'regular', signatoryIndex: 0 };
const EMPTY_TRANSFER: ResolvedFundTransfer = { signatoryIndex: 0 };

function summarizeMobile(r: ResolvedMobileBill): string {
  const entity = GROUP_ENTITIES.find((e) => e.id === r.entityId);
  const bits = [
    entity && `entity: ${entity.shortName}`,
    r.amount !== undefined && `amount: Tk. ${r.amount.toLocaleString()}`,
    r.month !== undefined && `period: ${MONTH_NAMES[r.month]}- ${r.year}`,
    r.mode && `mode: ${r.mode === 'single' ? 'single employee' : 'all employees'}`,
    r.mode === 'single' && r.singleEmployeeName && `employee: ${r.singleEmployeeName}`,
    r.mode === 'bulk' && r.employeeCount && `employees: ${r.employeeCount}`,
  ].filter(Boolean);
  return bits.length ? `Here's what I understood: ${bits.join(', ')}.` : "I couldn't pick up any details from that.";
}

function summarizeTransfer(r: ResolvedFundTransfer): string {
  const fromA = KNOWN_ACCOUNTS.find((a) => a.id === r.fromAccountId);
  const toA = KNOWN_ACCOUNTS.find((a) => a.id === r.toAccountId);
  const bits = [
    fromA && `from: ${accountDisplayName(fromA)}`,
    toA && `to: ${accountDisplayName(toA)}`,
    r.amount !== undefined && `amount: Tk. ${r.amount.toLocaleString()}`,
  ].filter(Boolean);
  return bits.length ? `Here's what I understood: ${bits.join(', ')}.` : "I couldn't pick up any details from that.";
}

export default function PromptLetterForm() {
  const [promptText, setPromptText] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [letterType, setLetterType] = useState<PromptLetterType | null>(null);
  const [mobile, setMobile] = useState<ResolvedMobileBill>(EMPTY_MOBILE);
  const [transfer, setTransfer] = useState<ResolvedFundTransfer>(EMPTY_TRANSFER);
  const [missing, setMissing] = useState<FieldSpec[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [meta, setMeta] = useState<LetterMeta | null>(null);
  const [body, setBody] = useState('');
  const rawPromptRef = useRef('');

  function reset() {
    setPromptText('');
    setStage('input');
    setLetterType(null);
    setMobile(EMPTY_MOBILE);
    setTransfer(EMPTY_TRANSFER);
    setMissing([]);
    setDraftAnswers({});
    setTurns([]);
    setMeta(null);
    setBody('');
  }

  function finalizeMobile(r: ResolvedMobileBill) {
    const entity = GROUP_ENTITIES.find((e) => e.id === r.entityId) ?? GROUP_ENTITIES[0];
    const periodLabel = `${MONTH_NAMES[r.month ?? 0]}- ${r.year}`;
    const letterDate = today();
    const mode = r.mode ?? 'bulk';
    const bodyText = buildBody({
      entityName: entity.name,
      cdAccountNo: entity.cdAccountNo,
      allowanceType: r.allowanceType,
      mode,
      periodLabel,
      amount: r.amount ?? 0,
      employeeCount: r.employeeCount ?? '',
      singleEmployeeName: r.singleEmployeeName ?? '',
      singleEmployeeAccount: r.singleEmployeeAccount ?? '',
    });
    const enclosureLine = buildEnclosureLine({
      mode,
      entityName: entity.name,
      employeeCount: r.employeeCount ?? '',
      singleEmployeeName: r.singleEmployeeName ?? '',
      singleEmployeeAccount: r.singleEmployeeAccount ?? '',
    });
    setMeta({
      letterDate,
      refNumber: suggestReference(entity.refPrefix, letterDate, '001'),
      subject: buildSubject({ allowanceType: r.allowanceType, periodLabel }),
      signatory: SIGNATORIES[r.signatoryIndex] ?? SIGNATORIES[0],
      closing: (
        <p className="mt-4">
          Your Co-operation in this regard will be highly appreciated.
          <br />
          Thanking You.
        </p>
      ),
      footer: <p className="whitespace-pre-line">{enclosureLine}</p>,
    });
    setBody(bodyText);
  }

  function finalizeTransfer(r: ResolvedFundTransfer) {
    const fromAccount = KNOWN_ACCOUNTS.find((a) => a.id === r.fromAccountId) ?? KNOWN_ACCOUNTS[0];
    const toAccount = KNOWN_ACCOUNTS.find((a) => a.id === r.toAccountId) ?? KNOWN_ACCOUNTS[1];
    const fromEntity = GROUP_ENTITIES.find((e) => e.id === fromAccount.entityId);
    const letterDate = today();
    const params = {
      fromEntityName: entityShortNameFor(fromAccount),
      fromAccountNo: fromAccount.accountNo,
      toEntityName: entityShortNameFor(toAccount),
      toAccountNo: toAccount.accountNo,
      amount: r.amount ?? 0,
    };
    setMeta({
      letterDate,
      refNumber: suggestReference(fromEntity?.refPrefix ?? '', letterDate, '001', 'FT'),
      subject: buildFundTransferSubject(params),
      signatory: SIGNATORIES[r.signatoryIndex] ?? SIGNATORIES[0],
      closing: (
        <>
          <p className="mt-4">Your Co-operation in this regard will be highly appreciated.</p>
          <p className="mt-4">Best regards.</p>
        </>
      ),
    });
    setBody(buildFundTransferBody(params));
  }

  function advance(type: PromptLetterType, resolved: ResolvedMobileBill | ResolvedFundTransfer) {
    const nextMissing =
      type === 'mobile-bill-allowance'
        ? getMissingMobileBillFields(resolved as ResolvedMobileBill)
        : getMissingFundTransferFields(resolved as ResolvedFundTransfer);

    if (nextMissing.length > 0) {
      setMissing(nextMissing);
      const summary = type === 'mobile-bill-allowance' ? summarizeMobile(resolved as ResolvedMobileBill) : summarizeTransfer(resolved as ResolvedFundTransfer);
      setTurns((t) => [...t, { role: 'assistant', text: `${summary} I still need a bit more before I can draft this.` }]);
      setStage('clarify');
      return;
    }

    setMissing([]);
    if (type === 'mobile-bill-allowance') finalizeMobile(resolved as ResolvedMobileBill);
    else finalizeTransfer(resolved as ResolvedFundTransfer);
    setTurns((t) => [...t, { role: 'assistant', text: "Got everything I need — here's your draft letter below. Feel free to edit the body before printing." }]);
    setStage('done');
  }

  function handleParse() {
    const text = promptText.trim();
    if (!text) return;
    rawPromptRef.current = text;
    setTurns([{ role: 'user', text }]);

    const detected = detectLetterType(text);
    if (!detected) {
      setLetterType(null);
      setMissing([LETTER_TYPE_FIELD]);
      setTurns((t) => [
        ...t,
        { role: 'assistant', text: "I couldn't tell if this is a Mobile Bill Allowance or a Fund Transfer letter — which one is it?" },
      ]);
      setStage('clarify');
      return;
    }

    setLetterType(detected);
    if (detected === 'mobile-bill-allowance') {
      const parsed = parseMobileBillPrompt(text);
      setMobile(parsed);
      advance('mobile-bill-allowance', parsed);
    } else {
      const parsed = parseFundTransferPrompt(text);
      setTransfer(parsed);
      advance('fund-transfer', parsed);
    }
  }

  function handleContinue() {
    const summary = missing
      .map((f) => {
        const val = draftAnswers[f.key];
        const opt = f.options?.find((o) => o.value === val);
        return `${f.label}: ${opt?.label ?? val}`;
      })
      .join(' · ');
    setTurns((t) => [...t, { role: 'user', text: summary }]);

    if (!letterType) {
      const chosenType = draftAnswers.letterType as PromptLetterType;
      setLetterType(chosenType);
      if (chosenType === 'mobile-bill-allowance') {
        const parsed = parseMobileBillPrompt(rawPromptRef.current);
        setMobile(parsed);
        advance('mobile-bill-allowance', parsed);
      } else {
        const parsed = parseFundTransferPrompt(rawPromptRef.current);
        setTransfer(parsed);
        advance('fund-transfer', parsed);
      }
      setDraftAnswers({});
      return;
    }

    if (letterType === 'mobile-bill-allowance') {
      const patch: Partial<ResolvedMobileBill> = {};
      for (const f of missing) {
        const v = draftAnswers[f.key];
        if (f.key === 'entityId') patch.entityId = v;
        else if (f.key === 'amount') patch.amount = Number(v);
        else if (f.key === 'month') patch.month = Number(v);
        else if (f.key === 'mode') patch.mode = v as ResolvedMobileBill['mode'];
        else if (f.key === 'employeeCount') patch.employeeCount = v;
        else if (f.key === 'singleEmployeeName') patch.singleEmployeeName = v;
        else if (f.key === 'singleEmployeeAccount') patch.singleEmployeeAccount = v;
      }
      const next = { ...mobile, ...patch };
      setMobile(next);
      advance('mobile-bill-allowance', next);
    } else {
      const patch: Partial<ResolvedFundTransfer> = {};
      for (const f of missing) {
        const v = draftAnswers[f.key];
        if (f.key === 'fromAccountId') patch.fromAccountId = v;
        else if (f.key === 'toAccountId') patch.toAccountId = v;
        else if (f.key === 'amount') patch.amount = Number(v);
      }
      const next = { ...transfer, ...patch };
      setTransfer(next);
      advance('fund-transfer', next);
    }
    setDraftAnswers({});
  }

  const allAnswered = missing.every((f) => (draftAnswers[f.key] ?? '').toString().trim() !== '');

  return (
    <div className="space-y-4">
      <div className="no-print rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700">Describe the letter you need</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          e.g. "Mobile bill allowance for Israq Cotton Mills, October 2026, all employees, Tk. 450,000" — give
          whatever details you know; anything missing will be asked below.
        </p>

        {stage === 'input' && (
          <>
            <textarea
              className="mt-3 h-20 w-full resize-none rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Type your request..."
            />
            <button
              onClick={handleParse}
              disabled={!promptText.trim()}
              className="mt-3 flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} />
              Generate from prompt
            </button>
          </>
        )}

        {stage !== 'input' && (
          <div className="mt-4 space-y-3">
            {turns.map((turn, i) => (
              <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    turn.role === 'user' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {turn.text}
                </div>
              </div>
            ))}

            {stage === 'clarify' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {missing.map((f) => (
                    <div key={f.key}>
                      <label className="mb-1 block text-xs font-medium text-slate-500">{f.label}</label>
                      {f.kind === 'select' ? (
                        <div className="flex flex-wrap gap-1.5">
                          {f.options?.map((o) => (
                            <button
                              key={o.value}
                              onClick={() => setDraftAnswers((a) => ({ ...a, [f.key]: o.value }))}
                              className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                                draftAnswers[f.key] === o.value
                                  ? 'bg-slate-800 text-white'
                                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={f.kind === 'number' ? 'number' : 'text'}
                          className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                          placeholder={f.placeholder}
                          value={draftAnswers[f.key] ?? ''}
                          onChange={(e) => setDraftAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleContinue}
                  disabled={!allAnswered}
                  className="mt-3 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            )}

            <button onClick={reset} className="text-xs font-medium text-slate-400 underline hover:text-slate-600">
              Start over with a new prompt
            </button>
          </div>
        )}
      </div>

      {stage === 'done' && meta && (
        <LetterShell
          letterDate={meta.letterDate}
          refNumber={meta.refNumber}
          subject={meta.subject}
          body={body}
          onBodyChange={setBody}
          signatory={meta.signatory}
          closing={meta.closing}
          footer={meta.footer}
        />
      )}
    </div>
  );
}
