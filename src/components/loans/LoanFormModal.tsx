import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import {
  BORROWER_TYPE_OPTIONS,
  DEFAULT_INTEREST_RATE,
  LOAN_STATUS_OPTIONS,
} from '../../constants/loans';
import { isContributingMember, loanSummary } from '../../lib/calculations';
import { describeSaveError } from '../../lib/errors';
import { fmt, todayISO, toNumber } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import type { BorrowerType, Loan, LoanStatus } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: Loan | null;
}

interface FormValues {
  borrowerType: BorrowerType;
  borrowerId: string;
  borrowerName: string;
  // Mantine NumberInput can emit strings ('' when cleared) — see toNumber().
  principal: number | string;
  interestRate: number | string;
  issueDate: string;
  dueDate: string;
  settledDate: string;
  status: LoanStatus;
  notes: string;
}

export function LoanFormModal({ opened, onClose, editing }: Props) {
  const upsertLoan = useAppStore((s) => s.upsertLoan);
  const members = useAppStore((s) => s.data.members);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberOptions = useMemo(
    () =>
      members
        .filter(isContributingMember)
        .map((m) => ({ value: m.id, label: m.name })),
    [members]
  );

  const form = useForm<FormValues>({
    initialValues: {
      borrowerType: 'member',
      borrowerId: '',
      borrowerName: '',
      principal: 0,
      interestRate: DEFAULT_INTEREST_RATE.member,
      issueDate: todayISO(),
      dueDate: '',
      settledDate: '',
      status: 'active',
      notes: '',
    },
    validate: {
      principal: (v) => {
        const n = toNumber(v);
        return n !== null && n > 0 ? null : 'Principal must be greater than 0';
      },
      interestRate: (v) => {
        const n = toNumber(v);
        return n !== null && n >= 0 ? null : 'Enter an interest rate (0 or more)';
      },
      issueDate: (v) => (v ? null : 'Issue date is required'),
      borrowerId: (v, values) =>
        values.borrowerType === 'member' && !v ? 'Select a member' : null,
      borrowerName: (v, values) =>
        values.borrowerType === 'outside' && v.trim().length < 2
          ? 'Enter the borrower name'
          : null,
    },
  });

  // Clear any error from a failed attempt so it doesn't greet the next opening.
  function close() {
    setError(null);
    onClose();
  }

  useEffect(() => {
    if (!opened) return;
    if (editing) {
      form.setValues({
        borrowerType: editing.borrowerType,
        borrowerId: editing.borrowerId ?? '',
        borrowerName: editing.borrowerName,
        principal: editing.principal,
        interestRate: editing.interestRate,
        issueDate: editing.issueDate,
        dueDate: editing.dueDate ?? '',
        settledDate: editing.settledDate ?? '',
        status: editing.status,
        notes: editing.notes,
      });
    } else {
      form.reset();
      form.setFieldValue('issueDate', todayISO());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editing?.id]);

  // Switching borrower type resets the rate to that type's default.
  function handleTypeChange(value: BorrowerType) {
    form.setFieldValue('borrowerType', value);
    form.setFieldValue('interestRate', DEFAULT_INTEREST_RATE[value]);
  }

  const { borrowerType, status } = form.values;
  const closed = status !== 'active';

  // Live preview using the form values (and any installments already paid).
  const preview: Loan = {
    id: 'preview',
    borrowerType,
    borrowerName: '',
    principal: toNumber(form.values.principal) ?? 0,
    interestRate: toNumber(form.values.interestRate) ?? 0,
    issueDate: form.values.issueDate || todayISO(),
    settledDate: closed ? form.values.settledDate || todayISO() : undefined,
    status,
    notes: '',
    repayments: editing?.repayments,
  };
  const summary = loanSummary(preview);
  const hasRepayments = (editing?.repayments?.length ?? 0) > 0;

  async function handleSubmit(values: FormValues) {
    const member =
      values.borrowerType === 'member'
        ? members.find((m) => m.id === values.borrowerId)
        : undefined;

    setError(null);
    setBusy(true);
    try {
      await upsertLoan({
        id: editing?.id,
        borrowerType: values.borrowerType,
        borrowerId:
          values.borrowerType === 'member' ? values.borrowerId : undefined,
        borrowerName:
          values.borrowerType === 'member'
            ? member?.name ?? 'Unknown member'
            : values.borrowerName.trim(),
        principal: toNumber(values.principal) ?? 0,
        interestRate: toNumber(values.interestRate) ?? 0,
        issueDate: values.issueDate,
        dueDate: values.dueDate || undefined,
        settledDate:
          values.status === 'active'
            ? undefined
            : values.settledDate || todayISO(),
        status: values.status,
        notes: values.notes,
      });
    } catch (e) {
      // Previously a rejected write was swallowed: the modal just sat there
      // with no feedback. Surface the reason instead.
      console.error('Saving loan failed:', e);
      setError(describeSaveError(e));
      return;
    } finally {
      setBusy(false);
    }

    notifications.show({
      title: editing ? 'Loan updated' : 'Loan recorded',
      message:
        values.borrowerType === 'member'
          ? member?.name ?? 'Member'
          : values.borrowerName,
      color: 'teal',
      autoClose: 2000,
    });
    close();
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={editing ? 'Edit loan' : 'Give out loan'}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Borrower type"
              data={BORROWER_TYPE_OPTIONS}
              value={borrowerType}
              allowDeselect={false}
              onChange={(v) => v && handleTypeChange(v as BorrowerType)}
            />
            {borrowerType === 'member' ? (
              <Select
                label="Member"
                placeholder="Select member"
                data={memberOptions}
                searchable
                nothingFoundMessage="No matching member"
                {...form.getInputProps('borrowerId')}
              />
            ) : (
              <TextInput
                label="Borrower name"
                placeholder="e.g. Ramesh Tamang"
                {...form.getInputProps('borrowerName')}
              />
            )}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="Principal"
              min={0}
              thousandSeparator
              prefix="Rs "
              {...form.getInputProps('principal')}
            />
            <NumberInput
              label="Interest rate (% per year)"
              min={0}
              step={0.5}
              decimalScale={2}
              suffix=" %"
              description={`Default ${DEFAULT_INTEREST_RATE[borrowerType]}% for ${borrowerType === 'member' ? 'members' : 'outside parties'}`}
              {...form.getInputProps('interestRate')}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              type="date"
              label="Issue date"
              {...form.getInputProps('issueDate')}
            />
            <TextInput
              type="date"
              label="Due date (optional)"
              {...form.getInputProps('dueDate')}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Status"
              data={LOAN_STATUS_OPTIONS}
              allowDeselect={false}
              {...form.getInputProps('status')}
            />
            {closed && (
              <TextInput
                type="date"
                label={status === 'repaid' ? 'Repaid on' : 'Written off on'}
                description="Interest accrues up to this date"
                {...form.getInputProps('settledDate')}
              />
            )}
          </SimpleGrid>

          <Group
            justify="space-between"
            p="sm"
            bg="var(--mantine-color-default-hover)"
            style={{ borderRadius: 8 }}
          >
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase">
                Interest {status === 'defaulted' ? '(collected)' : 'so far'}
              </Text>
              <Text fw={600}>{fmt(summary.totalInterest)}</Text>
            </Stack>
            {hasRepayments && (
              <Stack gap={0} align="center">
                <Text size="xs" c="dimmed" tt="uppercase">
                  Repaid
                </Text>
                <Text fw={600} className="text-positive">
                  {fmt(summary.totalRepaid)}
                </Text>
              </Stack>
            )}
            <Stack gap={0} align="flex-end">
              <Text size="xs" c="dimmed" tt="uppercase">
                {status === 'active'
                  ? 'Balance due'
                  : status === 'repaid'
                    ? 'Total repaid'
                    : 'Principal lost'}
              </Text>
              <Text fw={600}>
                {fmt(
                  status === 'active'
                    ? summary.balanceDue
                    : status === 'repaid'
                      ? summary.totalRepaid
                      : summary.principalOutstanding
                )}
              </Text>
            </Stack>
          </Group>

          <Textarea
            label="Notes"
            placeholder="Optional notes"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />

          {error && (
            <Alert
              color="red"
              variant="light"
              icon={<IconAlertCircle size={16} />}
              title="Couldn't save the loan"
            >
              {error}
            </Alert>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {editing ? 'Save changes' : 'Give loan'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
