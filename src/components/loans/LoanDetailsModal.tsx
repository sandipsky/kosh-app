import {
  Badge,
  Group,
  Modal,
  Progress,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { IconCalendarStats, IconReceipt2 } from '@tabler/icons-react';
import { LOAN_STATUS_COLORS, LOAN_STATUS_LABELS } from '../../constants/loans';
import { loanSummary } from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
import type { Loan } from '../../types';
import { LoanPlanner } from './LoanPlanner';
import { LoanRepayments } from './LoanRepayments';

export type LoanDetailsTab = 'repayments' | 'plan';

interface Props {
  loan: Loan | null;
  tab: LoanDetailsTab;
  onTabChange: (tab: LoanDetailsTab) => void;
  onClose: () => void;
}

function Stat({
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
      <Text fw={600} className={`num ${className ?? ''}`}>
        {value}
      </Text>
    </Stack>
  );
}

export function LoanDetailsModal({ loan, tab, onTabChange, onClose }: Props) {
  const summary = loan ? loanSummary(loan) : null;
  const isActive = loan?.status === 'active';
  const repaidPct =
    summary && summary.totalRepaid + summary.balanceDue > 0
      ? (summary.totalRepaid / (summary.totalRepaid + summary.balanceDue)) * 100
      : 0;

  return (
    <Modal
      opened={!!loan}
      onClose={onClose}
      centered
      size="xl"
      title={
        loan ? (
          <Group gap="xs">
            <Text fw={600}>Loan to {loan.borrowerName}</Text>
            <Badge
              size="sm"
              variant="light"
              color={LOAN_STATUS_COLORS[loan.status]}
            >
              {LOAN_STATUS_LABELS[loan.status]}
            </Badge>
          </Group>
        ) : null
      }
    >
      {loan && summary && (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Stat label="Principal" value={fmt(loan.principal)} />
            <Stat
              label="Repaid"
              value={fmt(summary.totalRepaid)}
              className="text-positive"
            />
            {isActive ? (
              <>
                <Stat label="Interest due" value={fmt(summary.interestDue)} />
                <Stat
                  label="Balance due"
                  value={fmt(summary.balanceDue)}
                  className="text-info"
                />
              </>
            ) : (
              <>
                <Stat
                  label={loan.status === 'repaid' ? 'Interest earned' : 'Interest collected'}
                  value={fmt(summary.totalInterest)}
                />
                <Stat
                  label={loan.status === 'repaid' ? 'Balance due' : 'Principal lost'}
                  value={fmt(loan.status === 'repaid' ? 0 : summary.principalOutstanding)}
                  className={loan.status === 'defaulted' ? 'text-negative' : undefined}
                />
              </>
            )}
          </SimpleGrid>

          {isActive && (
            <Stack gap={4}>
              <Progress value={repaidPct} color="teal" size="md" radius="xl" />
              <Text size="xs" c="dimmed">
                {Math.round(repaidPct)}% repaid · {loan.interestRate}% per year
                simple interest on the outstanding principal
              </Text>
            </Stack>
          )}

          <Tabs
            value={tab}
            onChange={(v) => v && onTabChange(v as LoanDetailsTab)}
            keepMounted={false}
          >
            <Tabs.List>
              <Tabs.Tab value="repayments" leftSection={<IconReceipt2 size={16} />}>
                Repayments ({loan.repayments?.length ?? 0})
              </Tabs.Tab>
              <Tabs.Tab value="plan" leftSection={<IconCalendarStats size={16} />}>
                Monthly plan
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="repayments" pt="md">
              <LoanRepayments loan={loan} />
            </Tabs.Panel>
            <Tabs.Panel value="plan" pt="md">
              <LoanPlanner loan={loan} onRecorded={() => onTabChange('repayments')} />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Modal>
  );
}
