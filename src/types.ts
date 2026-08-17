export type Currency = 'USD' | 'EUR';

// LDBC = Local Documentary Bill for Collection, IDBC = Inland/Import Documentary
// Bill for Collection — the two bill classifications used in the register.
export type BillType = 'LDBC' | 'IDBC';

export type DiscountStatus = 'Discounted' | 'Not Discounted';

export type Realization = {
  id: string;
  date: string; // ISO — Realized Date
  currency: Currency; // Realized Currency
  amountFC: number; // Partial Realized Value (this tranche's amount)
  exchangeRate: number; // BDT per unit of currency, at realization date
  fddPayOrderDate: string; // ISO — FDD/Pay Order Date
  scbErqBuildUpFC?: number; // SCB ERQ Build Up (C) — FC retained in the ERQ account
  shortOverValueFC?: number; // Short / Over Value $ — +over-realized, -short-realized
  shortOverValueBDT?: number; // Short / Over Value @ BDT
  sourceTaxRate?: number; // Source Tax rate applied (e.g. 0.006 = 0.60%)
  sourceTaxBDT?: number; // Source Tax BDT
  adjustmentDate?: string; // ISO — Adjustment Date (when short/over was settled)
};

export type LC = {
  id: string;
  lcNumber: string; // L/C NO.
  beneficiary: string; // PARTY NAME — the buyer/applicant on the export LC
  issuingBank: string; // L/C Issuing Bank
  branch: string; // BRANCH (of the issuing bank)
  location: string; // Location (city/country of the issuing bank)
  advisingBank: string; // ADVISING BANK (local negotiating bank)
  currency: Currency;
  lcValue: number; // VALUE-$
  billType: BillType; // LDBC/IDBC
  discountStatus: DiscountStatus; // Discount Status
  entryDate: string; // ISO — ENTRY DATE (booked into the register)
  issueDate: string; // ISO — LC OPEN DATE
  acceptanceDate?: string; // ISO — ACCEPTANCE DATE (usance/acceptance bills only)
  maturityDate: string; // ISO — MATURITY DATE
  realizations: Realization[];
  unit: string; // which spinning/textile unit
  responsiblePerson: string; // Responsible Person
  realizationPerson?: string; // Realization Person (assigned once realized)
  media?: string; // Media — instrument/channel of realization (SWIFT/TT/FDD/Pay Order)
  remarks?: string; // Remarks
  advBankReminderDate?: string; // ISO — Adv. Bank Reminder Date
  issuingBankVisitingDate?: string; // ISO — Issu. Bank Visiting Date
  nextVisitingDate?: string; // ISO — Next Visiting Date
  concessionalInterestReceivedDate?: string; // ISO — OD interest Received Date (6% scheme)
};

export type LCStatus = 'Realized' | 'Overdue' | 'Due Soon' | 'Open';

export type DueFlag = 'D' | 'OD'; // D/OD

export type Module = 'hub' | 'lc-tracking' | 'email-generation' | 'loan-management' | 'bank-charges' | 'yarn-costing' | 'lc-scrutiny';

// STL = Short Term Loan, UPAS = Usance Payable at Sight (deferred LC acceptance
// financing), OD = Overdraft, EDF = Export Development Fund (BB refinance, USD).
export type LoanType = 'STL' | 'UPAS' | 'OD' | 'EDF';

export type LoanCurrency = 'BDT' | 'USD';

export type LoanStatus = 'Settled' | 'Overdue' | 'Due Soon' | 'Active';

export type LoanFacility = {
  id: string;
  facilityNumber: string;
  loanType: LoanType;
  unit: string;
  bank: string;
  currency: LoanCurrency;
  principalAmount: number; // amount disbursed/drawn under this facility
  outstandingAmount: number; // remaining balance to be adjusted/repaid
  interestRatePct: number; // annual rate, e.g. 9.5 = 9.5% p.a.
  disbursementDate: string; // ISO
  maturityDate: string; // ISO — adjustment/repayment due date
  linkedLcNumber?: string; // for UPAS/EDF facilities drawn against a specific export LC
  responsiblePerson: string;
  remarks?: string;
};
