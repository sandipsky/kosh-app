import { Stack } from '@mantine/core';
import { LoansList } from '../components/loans/LoansList';

export function LoansPage() {
  return (
    <Stack gap="md">
      <LoansList />
    </Stack>
  );
}
