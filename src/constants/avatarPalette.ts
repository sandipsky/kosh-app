export const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#FAEEDA', fg: '#633806' },
  { bg: '#E6F1FB', fg: '#0C447C' },
  { bg: '#E1F5EE', fg: '#085041' },
  { bg: '#EEEDFE', fg: '#3C3489' },
  { bg: '#FCEBEB', fg: '#A32D2D' },
  { bg: '#FFF4D6', fg: '#6E4B0B' },
];

export function pickPaletteByIndex(i: number): { bg: string; fg: string } {
  return AVATAR_PALETTE[i % AVATAR_PALETTE.length];
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
