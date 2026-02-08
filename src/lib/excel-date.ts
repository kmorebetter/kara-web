export function excelSerialDate(dateStr: string): number {
  const base = new Date(1899, 11, 30); // Dec 30, 1899
  const [year, month, day] = dateStr.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  return Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}
