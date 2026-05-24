import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import {
  BS_YEARS,
  CURRENT_NEPALI_MONTH,
  CURRENT_NEPALI_YEAR,
  NEPALI_MONTHS,
} from '../../constants/months';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  opened: boolean;
  onClose: () => void;
}

interface FormValues {
  memberId: string;
  month: string;
  year: string;
  amount: number;
  paymentDate: Date;
}

export function PaymentFormModal({ opened, onClose }: Props) {
  const data = useAppStore((s) => s.data);
  const addPayment = useAppStore((s) => s.addPayment);
  const [error, setError] = useState<string | null>(null);

  const memberOptions = data.members
    .filter((m) => m.role !== 'admin')
    .map((m) => ({ value: m.id, label: m.name }));

  const form = useForm<FormValues>({
    initialValues: {
      memberId: memberOptions[0]?.value ?? '',
      month: CURRENT_NEPALI_MONTH,
      year: String(CURRENT_NEPALI_YEAR),
      amount: data.monthlyContribution,
      paymentDate: new Date(),
    },
    validate: {
      memberId: (v) => (v ? null : 'Pick a member'),
      amount: (v) => (v > 0 ? null : 'Amount must be greater than 0'),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setFieldValue('paymentDate', new Date());
      form.setFieldValue('amount', data.monthlyContribution);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  async function handleSubmit(values: FormValues) {
    const monthLabel = `${values.month} ${values.year}`;
    const payment = await addPayment({
      memberId: values.memberId,
      month: monthLabel,
      year: Number(values.year),
      amount: values.amount,
      paymentDate: values.paymentDate.toISOString(),
    });
    if (!payment) {
      const memberName =
        data.members.find((m) => m.id === values.memberId)?.name ?? 'Member';
      setError(`${memberName} already has a payment recorded for ${monthLabel}.`);
      return;
    }
    notifications.show({
      title: 'Payment recorded',
      message: `${data.members.find((m) => m.id === values.memberId)?.name} · ${monthLabel}`,
      color: 'teal',
      autoClose: 2000,
    });
    setError(null);
    form.reset();
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        form.reset();
        setError(null);
        onClose();
      }}
      title="Record a payment"
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} variant="light">
              {error}
            </Alert>
          )}
          <Select
            label="Member"
            data={memberOptions}
            searchable
            required
            {...form.getInputProps('memberId')}
          />
          <Group grow>
            <Select
              label="Month (BS)"
              data={[...NEPALI_MONTHS]}
              required
              {...form.getInputProps('month')}
            />
            <Select
              label="Year (BS)"
              data={BS_YEARS.map((y) => String(y))}
              required
              {...form.getInputProps('year')}
            />
          </Group>
          <Group grow>
            <NumberInput
              label="Amount (Rs)"
              min={1}
              thousandSeparator
              allowDecimal={false}
              {...form.getInputProps('amount')}
            />
            <DateInput
              label="Payment date"
              maxDate={new Date()}
              {...form.getInputProps('paymentDate')}
            />
          </Group>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Record payment</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
