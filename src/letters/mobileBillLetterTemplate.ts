import { amountToTakaWords } from '../numberToWords';

export type AllowanceType = 'regular' | 'supplementary';
export type DisbursementMode = 'bulk' | 'single';

export type LetterParams = {
  entityName: string;
  cdAccountNo: string;
  allowanceType: AllowanceType;
  mode: DisbursementMode;
  periodLabel: string; // e.g. "April- 2026"
  amount: number;
  employeeCount: string;
  singleEmployeeName: string;
  singleEmployeeAccount: string;
};

function allowanceLabel(allowanceType: AllowanceType): string {
  return allowanceType === 'supplementary' ? 'Supplementary Mobile Bill Allowance' : 'Mobile Bill Allowance';
}

export function buildSubject(params: Pick<LetterParams, 'allowanceType' | 'periodLabel'>): string {
  return `${allowanceLabel(params.allowanceType)} Disbursement for ${params.periodLabel}.`;
}

export function buildBody(params: LetterParams): string {
  const label = allowanceLabel(params.allowanceType);
  const amountFigure = params.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountWords = amountToTakaWords(params.amount);

  if (params.mode === 'single') {
    return `With due respect, we would like to inform you that we are maintaining a CD account no. ${params.cdAccountNo} of "${params.entityName}" with your bank. Kindly disburse the ${label} for the month of ${params.periodLabel} by debiting our mentioned CD account and crediting to the bank account no. ${params.singleEmployeeAccount} of ${params.singleEmployeeName} for TK. ${amountFigure} (${amountWords}).

Therefore, you are requested to disburse the ${label} from our CD account no. ${params.cdAccountNo} to the above-mentioned employee's bank account accordingly.`;
  }

  return `With due respect, we would like to inform you that we are maintaining a CD account no. ${params.cdAccountNo} of "${params.entityName}" with your bank. Kindly disburse the ${label} for the month of ${params.periodLabel} by debiting our mentioned CD account to our employees' respective bank accounts for TK. ${amountFigure} (${amountWords}).

Therefore, you are requested to disburse the ${label} from our CD account no. ${params.cdAccountNo} to our employees' respective bank accounts as per enclosed statement.`;
}

export function buildEnclosureLine(params: Pick<LetterParams, 'mode' | 'entityName' | 'employeeCount' | 'singleEmployeeName' | 'singleEmployeeAccount'>): string {
  if (params.mode === 'single') {
    return `Employee Name: ${params.singleEmployeeName}\nBank Account No.: ${params.singleEmployeeAccount}`;
  }
  const count = Number(params.employeeCount) || 0;
  return `Enclosed list of name and Bank Account number of employees\n${params.entityName} (Number of Employees – ${params.employeeCount} ${count === 1 ? 'Person' : 'Persons'}.)`;
}
