export function varianceTone(variance: number, favorableIsNegative: boolean, tolerance = 0.001): 'good' | 'bad' | 'neutral' {
  if (Math.abs(variance) <= tolerance) return 'neutral';
  const isNegative = variance < 0;
  const favorable = favorableIsNegative ? isNegative : !isNegative;
  return favorable ? 'good' : 'bad';
}

export default function VarianceCell({
  value,
  favorableIsNegative = false,
  format,
}: {
  value: number;
  favorableIsNegative?: boolean;
  format: (v: number) => string;
}) {
  const tone = varianceTone(value, favorableIsNegative);
  const cls = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : 'text-slate-400';
  const sign = value > 0 ? '+' : '';
  return <span className={`tabular-nums ${cls}`}>{sign}{format(value)}</span>;
}
