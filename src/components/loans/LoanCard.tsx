import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconCalendarDue,
  IconCalendarStats,
  IconEdit,
  IconReceipt2,
  IconTrash,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { canManageLoans } from '../../lib/permissions';
import { loanDays, loanSummary } from '../../lib/calculations';
import { fmt, formatDate } from '../../lib/formatters';
import { LOAN_STATUS_COLORS, LOAN_STATUS_LABELS } from '../../constants/loans';
import { useAppStore } from '../../store/useAppStore';
import { MemberAvatar } from '../common/MemberAvatar';
import type { Loan } from '../../types';
import type { LoanDetailsTab } from './LoanDetailsModal';

interface Props {
  loan: Loan;
  onEdit: (l: Loan) => void;
  onDelete: (l: Loan) => void;
  onOpenDetails: (l: Loan, tab: LoanDetailsTab) => void;
}

function Metric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text fw={600} size="md" className={`num ${className ?? ''}`}>
        {value}
      </Text>
    </Stack>
  );
}

export function LoanCard({ loan, onEdit, onDelete, onOpenDetails }: Props) {
  const { currentUser } = useAuth();
  const canEdit = canManageLoans(currentUser?.role);
  const member = useAppStore((s) =>
    loan.borrowerId ? s.data.members.find((m) => m.id === loan.borrowerId) : undefined
  );

  const summary = loanSummary(loan);
  const days = Math.floor(loanDays(loan));
  const isMember = loan.borrowerType === 'member';
  const isActive = loan.status === 'active';
  const defaulted = loan.status === 'defaulted';
  const repaymentCount = loan.repayments?.length ?? 0;
  const repaidPct =
    summary.totalRepaid + summary.balanceDue > 0
      ? (summary.totalRepaid / (summary.totalRepaid + summary.balanceDue)) * 100
      : 0;

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
              {isActive ? ` · ${days} day${days === 1 ? '' : 's'}` : ''}
            </Text>
            {loan.dueDate && isActive && (
              <Group gap={4} className="text-warning">
                <IconCalendarDue size={12} />
                <Text size="xs">Due {formatDate(loan.dueDate)}</Text>
              </Group>
            )}
            {loan.settledDate && !isActive && (
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

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mt="md">
        <Metric label="Principal" value={fmt(loan.principal)} />
        <Metric
          label={
            defaulted
              ? 'Interest collected'
              : loan.status === 'repaid'
                ? 'Interest earned'
                : 'Interest accrued'
          }
          value={fmt(summary.totalInterest)}
          className="text-positive"
        />
        <Metric
          label="Repaid"
          value={fmt(summary.totalRepaid)}
          className="text-positive"
        />
        {isActive ? (
          <Metric
            label="Balance due"
            value={fmt(summary.balanceDue)}
            className="text-info"
          />
        ) : defaulted ? (
          <Metric
            label="Principal lost"
            value={fmt(summary.principalOutstanding)}
            className="text-negative"
          />
        ) : (
          <Metric label="Balance due" value={fmt(0)} />
        )}
      </SimpleGrid>

      {isActive && repaymentCount > 0 && (
        <Stack gap={2} mt="sm">
          <Progress value={repaidPct} color="teal" size="sm" radius="xl" />
          <Text size="xs" c="dimmed">
            {Math.round(repaidPct)}% repaid in {repaymentCount} installment
            {repaymentCount === 1 ? '' : 's'}
          </Text>
        </Stack>
      )}

      {loan.notes && (
        <Text size="xs" c="dimmed" mt="sm">
          <b>Notes:</b> {loan.notes}
        </Text>
      )}

      <Group gap="xs" mt="md">
        <Button
          size="xs"
          variant="light"
          leftSection={<IconReceipt2 size={14} />}
          onClick={() => onOpenDetails(loan, 'repayments')}
        >
          {canEdit && isActive
            ? 'Record repayment'
            : `Repayments${repaymentCount ? ` (${repaymentCount})` : ''}`}
        </Button>
        {isActive && (
          <Button
            size="xs"
            variant="default"
            leftSection={<IconCalendarStats size={14} />}
            onClick={() => onOpenDetails(loan, 'plan')}
          >
            Monthly plan
          </Button>
        )}
      </Group>
    </Card>
  );
}
