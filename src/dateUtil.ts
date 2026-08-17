// Dates across all sample data are generated relative to the moment the app
// runs so that Overdue / Due Soon / Open(Active) statuses stay correct no
// matter when a demo is run.
export function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
