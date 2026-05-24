import { Stack } from '@mantine/core';
import { MembersTable } from '../components/members/MembersTable';

export function MembersPage() {
  return (
    <Stack gap="md">
      <MembersTable />
    </Stack>
  );
}
