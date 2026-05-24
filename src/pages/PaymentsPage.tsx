import { Stack } from '@mantine/core';
import { PaymentsList } from '../components/payments/PaymentsList';

export function PaymentsPage() {
  return (
    <Stack gap="md">
      <PaymentsList />
    </Stack>
  );
}
