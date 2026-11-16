export function fmt(n: number): string {
  return `Rs ${Math.round(n).toLocaleString('en-IN')}`;
}

/** Today's date as 'YYYY-MM-DD' in the user's local timezone (not UTC). */
export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Reads a Mantine NumberInput value, which may be a string ('' when cleared,
 * or e.g. '7.50' while it keeps trailing zeros). Returns null if not a number.
 */
export function toNumber(v: number | string): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function pct(a: number, b: number): number {
  return b ? Math.round((a / b) * 100) : 0;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
