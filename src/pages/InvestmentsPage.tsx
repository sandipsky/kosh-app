import { Stack } from '@mantine/core';
import { InvestmentsList } from '../components/investments/InvestmentsList';

export function InvestmentsPage() {
  return (
    <Stack gap="md">
      <InvestmentsList />
    </Stack>
  );
}
