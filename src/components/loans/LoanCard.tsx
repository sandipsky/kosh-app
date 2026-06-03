import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCalendarDue,
  IconCashBanknote,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { canManageLoans } from '../../lib/permissions';
import { loanDays, loanInterest, loanTotalDue } from '../../lib/calculations';
import { fmt, formatDate } from '../../lib/formatters';
import { LOAN_STATUS_COLORS, LOAN_STATUS_LABELS } from '../../constants/loans';
import { useAppStore } from '../../store/useAppStore';
import { MemberAvatar } from '../common/MemberAvatar';
import type { Loan } from '../../types';

interface Props {
  loan: Loan;
  onEdit: (l: Loan) => void;
  onDelete: (l: Loan) => void;
}

export function LoanCard({ loan, onEdit, onDelete }: Props) {
  const { currentUser } = useAuth();
  const canEdit = canManageLoans(currentUser?.role);
  const member = useAppStore((s) =>
    loan.borrowerId ? s.data.members.find((m) => m.id === loan.borrowerId) : undefined
  );

  const interest = loanInterest(loan);
  const totalDue = loanTotalDue(loan);
  const days = Math.floor(loanDays(loan));
  const isMember = loan.borrowerType === 'member';
  const defaulted = loan.status === 'defaulted';

  return (
    <Card padding="md" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
          {isMember && member ? (
            <MemberAvatar member={member} size={38} />
          ) : (
            <ThemeIcon color="orange" variant="light" size={38} radius="xl">
              <IconBuildingStore size={20} />
            </ThemeIcon>
          )}
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="wrap">
              <Text fw={600} size="sm" truncate>
                {loan.borrowerName}
              </Text>
              <Badge size="xs" color={isMember ? 'blue' : 'orange'} variant="light">
                {isMember ? 'Member' : 'Outside'}
              </Badge>
              <Badge
                size="xs"
                color={LOAN_STATUS_COLORS[loan.status]}
                variant="light"
              >
                {LOAN_STATUS_LABELS[loan.status]}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {loan.interestRate}% / yr · Issued {formatDate(loan.issueDate)}
              {loan.status === 'active' ? ` · ${days} day${days === 1 ? '' : 's'}` : ''}
            </Text>
            {loan.dueDate && loan.status === 'active' && (
              <Group gap={4} className="text-warning">
                <IconCalendarDue size={12} />
                <Text size="xs">Due {formatDate(loan.dueDate)}</Text>
              </Group>
            )}
            {loan.settledDate && loan.status !== 'active' && (
              <Text size="xs" c="dimmed">
                {loan.status === 'repaid' ? 'Repaid' : 'Written off'}{' '}
                {formatDate(loan.settledDate)}
              </Text>
            )}
          </Stack>
        </Group>
        {canEdit && (
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label="Edit loan"
              onClick={() => onEdit(loan)}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Delete loan"
              onClick={() => onDelete(loan)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      <Group justify="space-between" mt="md" wrap="wrap" gap="sm">
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Principal
          </Text>
          <Group gap={6} align="center">
            <IconCashBanknote size={16} color="var(--mantine-color-dimmed)" />
            <Text fw={600} size="md" className="num">
              {fmt(loan.principal)}
            </Text>
          </Group>
        </Stack>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Interest {defaulted ? '(lost)' : loan.status === 'repaid' ? 'earned' : 'accrued'}
          </Text>
          <Text
            fw={600}
            size="md"
            className={defaulted ? 'text-negative num' : 'text-positive num'}
          >
            {fmt(interest)}
          </Text>
        </Stack>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase">
            {loan.status === 'active' ? 'Total due' : 'Total'}
          </Text>
          <Text fw={600} size="md" className="num">
            {defaulted ? fmt(0) : fmt(totalDue)}
          </Text>
        </Stack>
      </Group>

      {loan.notes && (
        <Text size="xs" c="dimmed" mt="sm">
          <b>Notes:</b> {loan.notes}
        </Text>
      )}
    </Card>
  );
}
