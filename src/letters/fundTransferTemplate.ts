import { amountToTakaWords } from '../numberToWords';
import { GROUP_ENTITIES } from './shared';

export type KnownAccount = {
  id: string;
  entityId: string; // GroupEntity.id
  accountNo: string;
  label: string; // distinguishes this account from the entity's other accounts
};

// Every distinct account seen across historical Fund Transfer letters, so the
// form never requires typing/remembering an account number — only picking one
// by its plain-English label. Account numbers are dummy placeholders (not the
// group's real CD accounts); each entity's "-main" account matches its
// GroupEntity.cdAccountNo in shared.ts, since both refer to the same account.
export const KNOWN_ACCOUNTS: KnownAccount[] = [
  { id: 'itml-main', entityId: 'itml', accountNo: '1000000000001', label: 'Main CD Account' },
  { id: 'itml-central', entityId: 'itml', accountNo: '1000000000002', label: 'Central/Pooling Account' },
  { id: 'itml-secondary', entityId: 'itml', accountNo: '1000000000003', label: 'Secondary Account' },
  { id: 'itml-other', entityId: 'itml', accountNo: '00000000009', label: 'Other Account' },
  { id: 'ismi-main', entityId: 'ismi', accountNo: '2000000000001', label: 'Main CD Account' },
  { id: 'irsm-main', entityId: 'irsm', accountNo: '3000000000001', label: 'Main CD Account' },
  { id: 'icml-main', entityId: 'icml', accountNo: '4000000000001', label: 'Main CD Account' },
];

export function accountDisplayName(account: KnownAccount): string {
  const entity = GROUP_ENTITIES.find((e) => e.id === account.entityId);
  return `${entity?.shortName ?? account.entityId} — ${account.label} (${account.accountNo})`;
}

export function entityShortNameFor(account: KnownAccount): string {
  return GROUP_ENTITIES.find((e) => e.id === account.entityId)?.shortName ?? '';
}

export type FundTransferParams = {
  fromEntityName: string;
  fromAccountNo: string;
  toEntityName: string;
  toAccountNo: string;
  amount: number;
};

export function buildFundTransferSubject(params: FundTransferParams): string {
  const amountFigure = params.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Request to Transfer of Tk. ${amountFigure} from ${params.fromEntityName} A/C No # ${params.fromAccountNo} to ${params.toEntityName} A/C No # ${params.toAccountNo}.`;
}

export function buildFundTransferBody(params: FundTransferParams): string {
  const amountFigure = params.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountWords = amountToTakaWords(params.amount);

  return `In reference to the above subject, we would like to inform you that, we have available balance in our CD account no. ${params.fromAccountNo}. In this connection we request you to transfer Tk. ${amountFigure} (${amountWords}) from ${params.fromEntityName} A/C No # ${params.fromAccountNo} to ${params.toEntityName} A/C No # ${params.toAccountNo}.`;
}
