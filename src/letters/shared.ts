export type GroupEntity = {
  id: string;
  name: string; // full legal name, e.g. used in Mobile Bill Allowance letters
  shortName: string; // abbreviated form, e.g. used in Fund Transfer letters ("Ltd." not "Limited")
  cdAccountNo: string; // this entity's primary/main CD account
  refPrefix: string;
};

// The four Israq Group entities seen across historical correspondence with
// Bank Asia. Each letter category uses its own naming convention for the
// same entities (full "Limited" vs abbreviated "Ltd."), so both are stored.
// Account numbers are dummy placeholders (not the group's real CD accounts).
export const GROUP_ENTITIES: GroupEntity[] = [
  {
    id: 'itml',
    name: 'Israq Textile Mills Limited',
    shortName: 'Israq Textile Mills Ltd.',
    cdAccountNo: '1000000000001',
    refPrefix: 'ITML',
  },
  {
    id: 'ismi',
    name: 'Israq Spinning Mills Limited',
    shortName: 'Israq Spinning Mills Ltd.',
    cdAccountNo: '2000000000001',
    refPrefix: 'ISML',
  },
  {
    id: 'irsm',
    name: 'Israq Rotor Spinning Mills Limited',
    shortName: 'Israq Rotor Spinning Mills Ltd.',
    cdAccountNo: '3000000000001',
    refPrefix: 'IRSML',
  },
  {
    id: 'icml',
    name: 'Israq Cotton Mills Limited',
    shortName: 'Israq Cotton Mills Ltd.',
    cdAccountNo: '4000000000001',
    refPrefix: 'ICML',
  },
];

export type Signatory = { name: string; title: string; parenthesize?: boolean };

// Every name+title combination actually seen signing these letters.
export const SIGNATORIES: Signatory[] = [
  { name: 'Sajid Israq', title: 'Director' },
  { name: 'Sajid Israq', title: 'CEO' },
  { name: 'Md. Fazlul Hoque', title: 'Managing Director', parenthesize: true },
];

export const BANK_RECIPIENT_LINES = [
  'The Head of Operation',
  'Agent Banking Division',
  'Bank Asia Ltd',
  'Corporate Office',
  'Rangs Tower, 68 Purana Paltan',
  'Dhaka-1000, Bangladesh.',
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Ref format: {PREFIX}/HO/{category}/{YYYY}-{MM}/{seq} — category (e.g. "FT" for
// Fund Transfer) is omitted for letter types that don't use one (Mobile Bill Allowance).
export function suggestReference(refPrefix: string, letterDateIso: string, seq: string, category?: string): string {
  const d = new Date(letterDateIso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const categorySegment = category ? `/${category}` : '';
  return `${refPrefix}/HO${categorySegment}/${yyyy}-${mm}/${seq}`;
}
