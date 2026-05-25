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
import { currentMonthLabel } from '../../constants/months';
import { allPaymentMonths, isContributingMember } from '../../lib/calculations';
import { useAppStore } from '../../store/useAppStore';
import type { Payment } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: Payment | null;
}

interface FormValues {
  memberId: string;
  monthLabel: string; // "Ashoj 2082"
  amount: number;
  paymentDate: Date | string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function PaymentFormModal({ opened, onClose, editing }: Props) {
  const data = useAppStore((s) => s.data);
  const addPayment = useAppStore((s) => s.addPayment);
  const updatePayment = useAppStore((s) => s.updatePayment);
  const [error, setError] = useState<string | null>(null);

  const memberOptions = data.members
    .filter(isContributingMember)
    .map((m) => ({ value: m.id, label: m.name }));

  // Reverse so the most recent month is at the top of the dropdown.
  const monthOptions = [...allPaymentMonths()].reverse();

  const form = useForm<FormValues>({
    initialValues: {
      memberId: memberOptions[0]?.value ?? '',
      monthLabel: currentMonthLabel(),
      amount: data.monthlyContribution,
      paymentDate: new Date(),
    },
    validate: {
      memberId: (v) => (v ? null : 'Pick a member'),
      monthLabel: (v) =>
        monthOptions.includes(v) ? null : 'Pick a valid month',
      amount: (v) => (v > 0 ? null : 'Amount must be greater than 0'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    setError(null);
    if (editing) {
      form.setValues({
        memberId: editing.memberId,
        monthLabel: editing.month,
        amount: editing.amount,
        paymentDate: new Date(editing.paymentDate),
      });
    } else {
      form.setValues({
        memberId: memberOptions[0]?.value ?? '',
        monthLabel: currentMonthLabel(),
        amount: data.monthlyContribution,
        paymentDate: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editing?.id]);

  async function handleSubmit(values: FormValues) {
    const monthLabel = values.monthLabel;
    const year = Number(monthLabel.split(' ').at(-1));

    if (editing) {
      const conflict = data.payments.find(
        (p) =>
          p.id !== editing.id &&
          p.memberId === values.memberId &&
          p.month === monthLabel
      );
      if (conflict) {
        const memberName =
          data.members.find((m) => m.id === values.memberId)?.name ?? 'Member';
        setError(`${memberName} already has a payment recorded for ${monthLabel}.`);
        return;
      }
      await updatePayment(editing.id, {
        memberId: values.memberId,
        month: monthLabel,
        year,
        amount: values.amount,
        paymentDate: toDate(values.paymentDate).toISOString(),
      });
      notifications.show({
        title: 'Payment updated',
        message: `${data.members.find((m) => m.id === values.memberId)?.name} · ${monthLabel}`,
        color: 'teal',
        autoClose: 2000,
      });
      setError(null);
      onClose();
      return;
    }

    const payment = await addPayment({
      memberId: values.memberId,
      month: monthLabel,
      year,
      amount: values.amount,
      paymentDate: toDate(values.paymentDate).toISOString(),
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
      title={editing ? 'Edit payment' : 'Record a payment'}
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
          <Select
            label="Month (BS)"
            data={monthOptions}
            description="Earliest allowed is Ashoj 2082. Future months are OK for advance payments."
            required
            searchable
            {...form.getInputProps('monthLabel')}
          />
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
            <Button type="submit">{editing ? 'Save changes' : 'Record payment'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
