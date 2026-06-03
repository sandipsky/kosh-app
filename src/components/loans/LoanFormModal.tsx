import {
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
import { useEffect, useMemo } from 'react';
import {
  BORROWER_TYPE_OPTIONS,
  DEFAULT_INTEREST_RATE,
  LOAN_STATUS_OPTIONS,
} from '../../constants/loans';
import { isContributingMember, loanInterest, loanTotalDue } from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
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
  principal: number;
  interestRate: number;
  issueDate: string;
  dueDate: string;
  settledDate: string;
  status: LoanStatus;
  notes: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LoanFormModal({ opened, onClose, editing }: Props) {
  const upsertLoan = useAppStore((s) => s.upsertLoan);
  const members = useAppStore((s) => s.data.members);

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
      issueDate: today(),
      dueDate: '',
      settledDate: '',
      status: 'active',
      notes: '',
    },
    validate: {
      principal: (v) => (v > 0 ? null : 'Principal must be greater than 0'),
      interestRate: (v) => (v >= 0 ? null : 'Rate cannot be negative'),
      issueDate: (v) => (v ? null : 'Issue date is required'),
      borrowerId: (v, values) =>
        values.borrowerType === 'member' && !v ? 'Select a member' : null,
      borrowerName: (v, values) =>
        values.borrowerType === 'outside' && v.trim().length < 2
          ? 'Enter the borrower name'
          : null,
    },
  });

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

  // Live preview of interest using the form values.
  const preview: Loan = {
    id: 'preview',
    borrowerType,
    borrowerName: '',
    principal: form.values.principal || 0,
    interestRate: form.values.interestRate || 0,
    issueDate: form.values.issueDate || today(),
    settledDate: closed ? form.values.settledDate || today() : undefined,
    status,
    notes: '',
  };
  const interest = loanInterest(preview);
  const totalDue = loanTotalDue(preview);

  async function handleSubmit(values: FormValues) {
    const member =
      values.borrowerType === 'member'
        ? members.find((m) => m.id === values.borrowerId)
        : undefined;

    await upsertLoan({
      id: editing?.id,
      borrowerType: values.borrowerType,
      borrowerId: values.borrowerType === 'member' ? values.borrowerId : undefined,
      borrowerName:
        values.borrowerType === 'member'
          ? member?.name ?? 'Unknown member'
          : values.borrowerName.trim(),
      principal: values.principal,
      interestRate: values.interestRate,
      issueDate: values.issueDate,
      dueDate: values.dueDate || undefined,
      settledDate:
        values.status === 'active'
          ? undefined
          : values.settledDate || today(),
      status: values.status,
      notes: values.notes,
    });

    notifications.show({
      title: editing ? 'Loan updated' : 'Loan recorded',
      message:
        values.borrowerType === 'member'
          ? member?.name ?? 'Member'
          : values.borrowerName,
      color: 'teal',
      autoClose: 2000,
    });
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
              onChange={(v) => v && handleTypeChange(v as BorrowerType)}
            />
            {borrowerType === 'member' ? (
              <Select
                label="Member"
                placeholder="Select member"
                data={memberOptions}
                searchable
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
                Interest {status === 'defaulted' ? '(written off)' : 'so far'}
              </Text>
              <Text fw={600}>{fmt(interest)}</Text>
            </Stack>
            <Stack gap={0} align="flex-end">
              <Text size="xs" c="dimmed" tt="uppercase">
                Total due
              </Text>
              <Text fw={600}>{fmt(totalDue)}</Text>
            </Stack>
          </Group>

          <Textarea
            label="Notes"
            placeholder="Optional notes"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editing ? 'Save changes' : 'Give loan'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
