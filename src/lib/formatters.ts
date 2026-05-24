export function fmt(n: number): string {
  return `Rs ${Math.round(n).toLocaleString('en-IN')}`;
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
