import { GROUP_ENTITIES, MONTH_NAMES, SIGNATORIES, type GroupEntity } from './shared';
import { KNOWN_ACCOUNTS, accountDisplayName, type KnownAccount } from './fundTransferTemplate';
import type { AllowanceType, DisbursementMode } from './mobileBillLetterTemplate';

// Rule-based (non-AI) extraction of letter fields from a free-text prompt.
// There is no backend/LLM in this prototype, so "understanding" the prompt
// means keyword/regex matching against the known entities, accounts, and
// vocabulary used in these letters. Whatever it can't confidently resolve is
// left undefined so the UI can ask the user for it instead of guessing.

export type PromptLetterType = 'mobile-bill-allowance' | 'fund-transfer';

export type FieldKind = 'select' | 'text' | 'number';

export type FieldOption = { value: string; label: string };

export type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: FieldOption[];
  placeholder?: string;
};

export type ResolvedMobileBill = {
  entityId?: string;
  amount?: number;
  month?: number;
  year: number;
  allowanceType: AllowanceType;
  mode?: DisbursementMode;
  employeeCount?: string;
  singleEmployeeName?: string;
  singleEmployeeAccount?: string;
  signatoryIndex: number;
};

export type ResolvedFundTransfer = {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
  signatoryIndex: number;
};

export function detectLetterType(text: string): PromptLetterType | null {
  const t = text.toLowerCase();
  const transferHit = /\btransfer\b/.test(t);
  const allowanceHit = /\ballowance\b|\bmobile bill\b|\bdisburse/.test(t);
  if (transferHit && !allowanceHit) return 'fund-transfer';
  if (allowanceHit && !transferHit) return 'mobile-bill-allowance';
  if (transferHit && allowanceHit) {
    return t.indexOf('transfer') < t.indexOf('allowance') ? 'fund-transfer' : 'mobile-bill-allowance';
  }
  return null;
}

// "Spinning Mills" is a substring of both the ISMI and IRSM entity names, so
// the more specific "rotor" keyword must be checked first to avoid matching
// the wrong entity.
function findEntity(text: string): GroupEntity | undefined {
  const t = text.toLowerCase();
  const byId = (id: string) => GROUP_ENTITIES.find((e) => e.id === id);
  if (t.includes('rotor')) return byId('irsm');
  if (t.includes('cotton')) return byId('icml');
  if (t.includes('spinning')) return byId('ismi');
  if (t.includes('textile')) return byId('itml');
  return GROUP_ENTITIES.find(
    (e) => t.includes(e.id) || t.includes(e.refPrefix.toLowerCase()) || t.includes(e.name.toLowerCase())
  );
}

function findAccountForEntity(text: string, entity: GroupEntity | undefined): KnownAccount | undefined {
  if (!entity) return undefined;
  const candidates = KNOWN_ACCOUNTS.filter((a) => a.entityId === entity.id);
  if (candidates.length <= 1) return candidates[0];
  const t = text.toLowerCase();
  if (t.includes('central') || t.includes('pooling')) return candidates.find((a) => a.label.toLowerCase().includes('central'));
  if (t.includes('secondary')) return candidates.find((a) => a.label.toLowerCase().includes('secondary'));
  if (t.includes('other')) return candidates.find((a) => a.label.toLowerCase().includes('other'));
  return candidates.find((a) => a.label.toLowerCase().includes('main')) ?? candidates[0];
}

function parseAmount(text: string): number | undefined {
  const tagged =
    text.match(/(?:tk\.?|taka|amount(?:\s+of)?)\s*[:\-]?\s*([\d,]+(?:\.\d+)?)/i) ||
    text.match(/([\d,]+(?:\.\d+)?)\s*(?:tk\.?|taka)/i);
  if (tagged) return Number(tagged[1].replace(/,/g, ''));

  // Fallback: a comma-grouped number, or a bare 4-6 digit number (long enough
  // to be a taka amount, short enough not to be an account number), excluding
  // anything that looks like a calendar year.
  const candidates = [...text.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d{4,6}(?:\.\d+)?\b/g)]
    .map((m) => Number(m[0].replace(/,/g, '')))
    .filter((n) => !(n >= 2000 && n <= 2099));
  return candidates.length ? Math.max(...candidates) : undefined;
}

function parseMonthYear(text: string): { month?: number; year?: number } {
  const t = text.toLowerCase();
  const monthIdx = MONTH_NAMES.findIndex((m) => {
    const full = m.toLowerCase();
    const abbr = full.slice(0, 3);
    return new RegExp(`\\b${full}\\b`).test(t) || new RegExp(`\\b${abbr}\\b`).test(t);
  });
  const yearMatch = text.match(/\b(20\d{2})\b/);
  return {
    month: monthIdx >= 0 ? monthIdx : undefined,
    year: yearMatch ? Number(yearMatch[1]) : undefined,
  };
}

function parseAllowanceType(text: string): AllowanceType {
  return /supplementary/i.test(text) ? 'supplementary' : 'regular';
}

function parseSignatoryIndex(text: string): number | undefined {
  const t = text.toLowerCase();
  const idx = SIGNATORIES.findIndex((s) => t.includes(s.name.toLowerCase()));
  return idx >= 0 ? idx : undefined;
}

function parseMode(text: string): DisbursementMode | undefined {
  const t = text.toLowerCase();
  if (/\ball employees\b|\bbulk\b|\beveryone\b|\ball staff\b/.test(t)) return 'bulk';
  if (/\bsingle employee\b|\bone employee\b|\bindividual\b|\bspecific employee\b/.test(t)) return 'single';
  return undefined;
}

function parseEmployeeName(text: string): string | undefined {
  const patterns = [
    /employee(?:'s)?\s+name\s*[:\-]?\s*([A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,3})/,
    /(?:for|to)\s+((?:Mr\.|Mrs\.|Ms\.|Md\.)?\s?[A-Z][a-zA-Z.]+(?:\s+[A-Z][a-zA-Z.]+){0,3})(?=\s*(?:,|\(|account|a\/c|$))/,
  ];
  // "for/to <Name>" also matches how the entity itself is usually phrased
  // ("... for Israq Cotton Mills ..."), so a company-name-shaped capture is
  // rejected rather than mistaken for an employee.
  const isCompanyName = (candidate: string) => /israq|mills|limited|ltd\.?/i.test(candidate);
  for (const p of patterns) {
    const m = text.match(p);
    if (m && !isCompanyName(m[1])) return m[1].trim();
  }
  return undefined;
}

function parseSingleEmployeeAccount(text: string, entity: GroupEntity | undefined): string | undefined {
  const matches = [...text.matchAll(/\b\d{8,}\b/g)].map((m) => m[0]);
  const excluded = new Set([entity?.cdAccountNo, ...KNOWN_ACCOUNTS.map((a) => a.accountNo)].filter(Boolean));
  return matches.find((m) => !excluded.has(m));
}

export function parseMobileBillPrompt(text: string): ResolvedMobileBill {
  const entity = findEntity(text);
  const amount = parseAmount(text);
  const { month, year } = parseMonthYear(text);
  const allowanceType = parseAllowanceType(text);
  const signatoryIndex = parseSignatoryIndex(text) ?? 0;
  const employeeCount = text.match(/\b(\d{1,4})\s*(?:employees|persons|staff)\b/i)?.[1];
  const singleEmployeeName = parseEmployeeName(text);
  const singleEmployeeAccount = parseSingleEmployeeAccount(text, entity);

  let mode = parseMode(text);
  if (!mode) {
    if (singleEmployeeName || singleEmployeeAccount) mode = 'single';
    else if (employeeCount) mode = 'bulk';
  }

  return {
    entityId: entity?.id,
    amount,
    month,
    year: year ?? new Date().getFullYear(),
    allowanceType,
    mode,
    employeeCount,
    singleEmployeeName,
    singleEmployeeAccount,
    signatoryIndex,
  };
}

export function parseFundTransferPrompt(text: string): ResolvedFundTransfer {
  const amount = parseAmount(text);
  const signatoryIndex = parseSignatoryIndex(text) ?? 0;
  const lower = text.toLowerCase();
  const toIdx = lower.indexOf(' to ');

  let fromEntity: GroupEntity | undefined;
  let toEntity: GroupEntity | undefined;
  if (toIdx >= 0) {
    fromEntity = findEntity(text.slice(0, toIdx));
    toEntity = findEntity(text.slice(toIdx));
  } else {
    fromEntity = findEntity(text);
  }
  if (fromEntity && toEntity && fromEntity.id === toEntity.id) {
    toEntity = undefined;
  }

  const fromAccount = findAccountForEntity(text, fromEntity);
  const toAccount = findAccountForEntity(toIdx >= 0 ? text.slice(toIdx) : text, toEntity);

  return {
    fromAccountId: fromAccount?.id,
    toAccountId: toEntity ? toAccount?.id : undefined,
    amount,
    signatoryIndex,
  };
}

export function getMissingMobileBillFields(r: ResolvedMobileBill): FieldSpec[] {
  const fields: FieldSpec[] = [];
  if (!r.entityId) {
    fields.push({
      key: 'entityId',
      label: 'Which group entity is this for?',
      kind: 'select',
      options: GROUP_ENTITIES.map((e) => ({ value: e.id, label: e.shortName })),
    });
  }
  if (r.amount === undefined) {
    fields.push({ key: 'amount', label: 'Total amount (Tk.)', kind: 'number', placeholder: 'e.g. 450000' });
  }
  if (r.month === undefined) {
    fields.push({
      key: 'month',
      label: 'Allowance month',
      kind: 'select',
      options: MONTH_NAMES.map((m, i) => ({ value: String(i), label: m })),
    });
  }
  if (!r.mode) {
    fields.push({
      key: 'mode',
      label: 'Disburse to all employees, or one specific employee?',
      kind: 'select',
      options: [
        { value: 'bulk', label: 'All Employees' },
        { value: 'single', label: 'Single Employee' },
      ],
    });
    return fields;
  }
  if (r.mode === 'bulk' && !r.employeeCount) {
    fields.push({ key: 'employeeCount', label: 'Number of employees', kind: 'number', placeholder: 'e.g. 120' });
  }
  if (r.mode === 'single') {
    if (!r.singleEmployeeName) {
      fields.push({ key: 'singleEmployeeName', label: 'Employee name', kind: 'text', placeholder: 'e.g. Md. Kamal Hossain' });
    }
    if (!r.singleEmployeeAccount) {
      fields.push({ key: 'singleEmployeeAccount', label: 'Employee bank account no.', kind: 'text', placeholder: 'e.g. 1234567890123' });
    }
  }
  return fields;
}

export function getMissingFundTransferFields(r: ResolvedFundTransfer): FieldSpec[] {
  const fields: FieldSpec[] = [];
  if (!r.fromAccountId) {
    fields.push({
      key: 'fromAccountId',
      label: 'Transfer from which account?',
      kind: 'select',
      options: KNOWN_ACCOUNTS.map((a) => ({ value: a.id, label: accountDisplayName(a) })),
    });
  }
  if (!r.toAccountId) {
    fields.push({
      key: 'toAccountId',
      label: 'Transfer to which account?',
      kind: 'select',
      options: KNOWN_ACCOUNTS.map((a) => ({ value: a.id, label: accountDisplayName(a) })),
    });
  }
  if (r.amount === undefined) {
    fields.push({ key: 'amount', label: 'Transfer amount (Tk.)', kind: 'number', placeholder: 'e.g. 500000' });
  }
  return fields;
}
