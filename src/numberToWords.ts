const ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const rest = n % 10;
  return rest ? `${TENS[tens]}-${ONES[rest]}` : TENS[tens];
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(' ');
}

// Indian/Bangladeshi numbering (crore/lakh/thousand) — the convention used for Taka amounts.
export function numberToWords(n: number): string {
  const value = Math.floor(Math.abs(n));
  if (value === 0) return 'Zero';

  const crore = Math.floor(value / 1e7);
  const lakh = Math.floor((value % 1e7) / 1e5);
  const thousand = Math.floor((value % 1e5) / 1e3);
  const rest = value % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lac`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  return parts.join(' ');
}

export function amountToTakaWords(amount: number): string {
  const taka = Math.floor(Math.abs(amount));
  const paisa = Math.round((Math.abs(amount) - taka) * 100);
  const takaWords = `${numberToWords(taka)} Taka`;
  if (paisa > 0) return `${takaWords} and ${numberToWords(paisa)} Paisa only`;
  return `${takaWords} only`;
}
