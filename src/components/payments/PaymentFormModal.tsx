import {
  Alert,
  Anchor,
  Button,
  FileInput,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconPaperclip,
  IconX,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { currentMonthLabel, MONTHS_ORDER } from '../../constants/months';
import { allPaymentMonths, isContributingMember } from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import type { Attachment } from '../../lib/storage';
import type { Payment } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: Payment | null;
}

type Mode = 'single' | 'multi';

interface FormValues {
  memberId: string;
  monthLabel: string; // start month, e.g. "Ashoj 2082"
  amount: number; // single: the payment amount. multi: the TOTAL across all months.
  months: number; // how many consecutive months (multi mode)
  paymentDate: Date | string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function yearOf(monthLabel: string): number {
  return Number(monthLabel.split(' ').at(-1));
}

/** `count` consecutive months from `startLabel` (inclusive), within MONTHS_ORDER. */
function consecutiveMonths(startLabel: string, count: number): string[] {
  const startIdx = MONTHS_ORDER.indexOf(startLabel);
  if (startIdx < 0) return [];
  return MONTHS_ORDER.slice(startIdx, startIdx + count);
}

/**
 * Split a whole-rupee `total` evenly across `count` months. When it doesn't
 * divide evenly, the leftover rupees go to the earliest months so the parts
 * always sum back to `total` (e.g. 10,000 over 3 → [3,334, 3,333, 3,333]).
 */
function splitAmount(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  let remainder = total - base * count;
  return Array.from({ length: count }, () => {
    if (remainder > 0) {
      remainder -= 1;
      return base + 1;
    }
    return base;
  });
}

export function PaymentFormModal({ opened, onClose, editing }: Props) {
  const data = useAppStore((s) => s.data);
  const addPayment = useAppStore((s) => s.addPayment);
  const updatePayment = useAppStore((s) => s.updatePayment);
  const uploadAttachment = useAppStore((s) => s.uploadAttachment);
  const removeAttachment = useAppStore((s) => s.removeAttachment);
  const deleteAttachment = useAppStore((s) => s.deleteAttachment);

  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('single');
  const [file, setFile] = useState<File | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [busy, setBusy] = useState(false);

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
      months: 1,
      paymentDate: new Date(),
    },
    validate: {
      memberId: (v) => (v ? null : 'Pick a member'),
      monthLabel: (v) =>
        monthOptions.includes(v) ? null : 'Pick a valid month',
      amount: (v) => (v > 0 ? null : 'Amount must be greater than 0'),
      months: (v) =>
        mode === 'multi' && (!Number.isInteger(v) || v < 1 || v > 36)
          ? 'Choose between 1 and 36 months'
          : null,
    },
  });

  const existingAttachment =
    editing?.attachmentUrl && !removeExisting ? editing : null;

  // Reset the form + local state whenever the modal opens or the edit target
  // changes. This is a reset-on-prop-change effect, hence the rule opt-out.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!opened) return;
    setError(null);
    setMode('single');
    setFile(null);
    setRemoveExisting(false);
    if (editing) {
      form.setValues({
        memberId: editing.memberId,
        monthLabel: editing.month,
        amount: editing.amount,
        months: 1,
        paymentDate: new Date(editing.paymentDate),
      });
    } else {
      form.setValues({
        memberId: memberOptions[0]?.value ?? '',
        monthLabel: currentMonthLabel(),
        amount: data.monthlyContribution,
        months: 1,
        paymentDate: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editing?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function close() {
    form.reset();
    setError(null);
    setFile(null);
    setRemoveExisting(false);
    setMode('single');
    onClose();
  }

  function attachmentFields(a: Attachment): Partial<Payment> {
    return {
      attachmentUrl: a.url,
      attachmentPath: a.path,
      attachmentName: a.name,
    };
  }

  // --- Edit ----------------------------------------------------------------
  async function submitEdit(values: FormValues, editingPayment: Payment) {
    const monthLabel = values.monthLabel;
    const conflict = data.payments.find(
      (p) =>
        p.id !== editingPayment.id &&
        p.memberId === values.memberId &&
        p.month === monthLabel
    );
    if (conflict) {
      const memberName =
        data.members.find((m) => m.id === values.memberId)?.name ?? 'Member';
      setError(`${memberName} already has a payment recorded for ${monthLabel}.`);
      return;
    }

    const patch: Partial<Payment> = {
      memberId: values.memberId,
      month: monthLabel,
      year: yearOf(monthLabel),
      amount: values.amount,
      paymentDate: toDate(values.paymentDate).toISOString(),
    };

    if (file) {
      const uploaded = await uploadAttachment(file);
      Object.assign(patch, attachmentFields(uploaded));
    }

    // updatePayment handles dropping a replaced file when it isn't shared.
    await updatePayment(editingPayment.id, patch);

    if (!file && removeExisting && editingPayment.attachmentUrl) {
      await removeAttachment(editingPayment.id);
    }

    notifications.show({
      title: 'Payment updated',
      message: `${data.members.find((m) => m.id === values.memberId)?.name} · ${monthLabel}`,
      color: 'teal',
      autoClose: 2000,
    });
    close();
  }

  // --- Single add ----------------------------------------------------------
  async function submitSingle(values: FormValues) {
    const monthLabel = values.monthLabel;
    let attachment: Attachment | null = null;
    if (file) attachment = await uploadAttachment(file);

    const payment = await addPayment({
      memberId: values.memberId,
      month: monthLabel,
      year: yearOf(monthLabel),
      amount: values.amount,
      paymentDate: toDate(values.paymentDate).toISOString(),
      ...(attachment ? attachmentFields(attachment) : {}),
    });

    if (!payment) {
      // Roll back the orphaned upload before surfacing the error.
      if (attachment) await deleteAttachment(attachment.path);
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
    close();
  }

  // --- Multi add -----------------------------------------------------------
  async function submitMulti(values: FormValues) {
    const targetMonths = consecutiveMonths(values.monthLabel, values.months);
    const alreadyPaid = new Set(
      data.payments
        .filter((p) => p.memberId === values.memberId)
        .map((p) => p.month)
    );
    const toCreate = targetMonths.filter((m) => !alreadyPaid.has(m));

    if (toCreate.length === 0) {
      const memberName =
        data.members.find((m) => m.id === values.memberId)?.name ?? 'Member';
      setError(
        `${memberName} already has payments for all ${targetMonths.length} selected months.`
      );
      return;
    }

    // `values.amount` is the TOTAL for the whole span — split it per month.
    const perMonth = splitAmount(values.amount, targetMonths.length);

    // One receipt is shared across every month created in this batch.
    let attachment: Attachment | null = null;
    if (file) attachment = await uploadAttachment(file);

    let created = 0;
    let createdTotal = 0;
    const paymentDate = toDate(values.paymentDate).toISOString();
    for (let i = 0; i < targetMonths.length; i++) {
      const monthLabel = targetMonths[i];
      if (alreadyPaid.has(monthLabel)) continue;
      const amount = perMonth[i];
      const result = await addPayment({
        memberId: values.memberId,
        month: monthLabel,
        year: yearOf(monthLabel),
        amount,
        paymentDate,
        ...(attachment ? attachmentFields(attachment) : {}),
      });
      if (result) {
        created += 1;
        createdTotal += amount;
      }
    }

    const skipped = targetMonths.length - created;
    const memberName = data.members.find((m) => m.id === values.memberId)?.name;
    notifications.show({
      title: `${created} payment${created === 1 ? '' : 's'} recorded`,
      message:
        `${memberName} · ${fmt(createdTotal)} total` +
        (skipped > 0 ? ` (${skipped} month${skipped === 1 ? '' : 's'} already paid, skipped)` : ''),
      color: 'teal',
      autoClose: 3000,
    });
    close();
  }

  async function handleSubmit(values: FormValues) {
    if (file && file.size > MAX_FILE_BYTES) {
      setError('Attachment must be 5 MB or smaller.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (editing) {
        await submitEdit(values, editing);
      } else if (mode === 'multi') {
        await submitMulti(values);
      } else {
        await submitSingle(values);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const targetMonths =
    mode === 'multi'
      ? consecutiveMonths(form.values.monthLabel, form.values.months || 0)
      : [];
  const multiTotal = form.values.amount; // amount IS the total in multi mode
  const multiPerMonth = targetMonths.length
    ? splitAmount(multiTotal, targetMonths.length)
    : [];
  const multiEven = multiPerMonth.every((a) => a === multiPerMonth[0]);

  return (
    <Modal
      opened={opened}
      onClose={close}
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

          {!editing && (
            <SegmentedControl
              fullWidth
              value={mode}
              onChange={(v) => setMode(v as Mode)}
              data={[
                { label: 'Single month', value: 'single' },
                { label: 'Multiple months', value: 'multi' },
              ]}
            />
          )}

          <Select
            label="Member"
            data={memberOptions}
            searchable
            required
            {...form.getInputProps('memberId')}
          />

          <Select
            label={mode === 'multi' ? 'Starting month (BS)' : 'Month (BS)'}
            data={monthOptions}
            description={
              mode === 'multi'
                ? 'Payments are created for this month and the following ones.'
                : 'Earliest allowed is Ashoj 2082. Future months are OK for advance payments.'
            }
            required
            searchable
            {...form.getInputProps('monthLabel')}
          />

          <Group grow>
            <NumberInput
              label={mode === 'multi' ? 'Total amount (Rs)' : 'Amount (Rs)'}
              description={
                mode === 'multi' ? 'Split evenly across the months below' : undefined
              }
              min={1}
              thousandSeparator
              allowDecimal={false}
              {...form.getInputProps('amount')}
            />
            {mode === 'multi' ? (
              <NumberInput
                label="Number of months"
                min={1}
                max={36}
                allowDecimal={false}
                {...form.getInputProps('months')}
              />
            ) : (
              <DateInput
                label="Payment date"
                maxDate={new Date()}
                {...form.getInputProps('paymentDate')}
              />
            )}
          </Group>

          {mode === 'multi' && (
            <>
              <DateInput
                label="Payment date"
                maxDate={new Date()}
                {...form.getInputProps('paymentDate')}
              />
              {targetMonths.length > 0 && (
                <Alert variant="light" color="blue" icon={<IconAlertCircle size={16} />}>
                  <Text size="sm">
                    Splitting <b>{fmt(multiTotal)}</b> across{' '}
                    <b>{targetMonths.length} months</b> (
                    {targetMonths[0]} → {targetMonths[targetMonths.length - 1]}) ={' '}
                    <b>
                      {multiEven
                        ? `${fmt(multiPerMonth[0])}/month`
                        : `${fmt(multiPerMonth[multiPerMonth.length - 1])}–${fmt(multiPerMonth[0])}/month`}
                    </b>
                    . Months already paid are skipped.
                  </Text>
                </Alert>
              )}
            </>
          )}

          {existingAttachment && (
            <Group justify="space-between" gap="xs" wrap="nowrap">
              <Group gap={6} wrap="nowrap">
                <IconPaperclip size={16} />
                <Anchor
                  href={existingAttachment.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  truncate
                >
                  {existingAttachment.attachmentName ?? 'View attachment'}
                </Anchor>
              </Group>
              <Button
                variant="subtle"
                color="red"
                size="compact-sm"
                leftSection={<IconX size={14} />}
                onClick={() => setRemoveExisting(true)}
              >
                Remove
              </Button>
            </Group>
          )}

          <FileInput
            label={
              editing && editing.attachmentUrl && !removeExisting
                ? 'Replace attachment'
                : 'Attachment (receipt)'
            }
            placeholder="Image or PDF, up to 5 MB"
            accept="image/*,application/pdf"
            clearable
            leftSection={<IconPaperclip size={16} />}
            value={file}
            onChange={setFile}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {editing
                ? 'Save changes'
                : mode === 'multi'
                  ? 'Record payments'
                  : 'Record payment'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
