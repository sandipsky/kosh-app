import { Badge } from '@mantine/core';
import type { MemberStatus } from '../../lib/calculations';

export function StatusBadge({ status }: { status: MemberStatus }) {
  return status === 'cleared' ? (
    <Badge color="teal" variant="light" radius="sm">
      Cleared
    </Badge>
  ) : (
    <Badge color="red" variant="light" radius="sm">
      Behind
    </Badge>
  );
}
