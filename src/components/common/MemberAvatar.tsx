import type { Member } from '../../types';

interface Props {
  member: Pick<Member, 'initials' | 'color' | 'fg'>;
  size?: number;
}

export function MemberAvatar({ member, size = 28 }: Props) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: member.color,
        color: member.fg,
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {member.initials}
    </span>
  );
}
