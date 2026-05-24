import { Badge } from '@mantine/core';
import type { Role } from '../../types';
import { ROLE_LABELS } from '../../constants/roles';

const COLOR: Record<Role, string> = {
  admin: 'grape',
  treasurer: 'blue',
  member: 'gray',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge color={COLOR[role]} variant="light" radius="sm">
      {ROLE_LABELS[role]}
    </Badge>
  );
}
