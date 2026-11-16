import {
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { installmentPlan, loanSummary } from '../../lib/calculations';
import { describeSaveError } from '../../lib/errors';
import { fmt, todayISO, toNumber } from '../../lib/formatters';
import { canManageLoans } from '../../lib/permissions';
import { useAppStore } from '../../store/useAppStore';
import type { Loan } from '../../types';

interface Props {
  loan: Loan;
  /** Called after "pay now" is recorded as a real repayment. */
  onRecorded?: () => void;
}

const DEFAULT_MONTHS = 12;
const MAX_MONTHS = 120;

/** Whole months from now until the due date, if it's at least a month away. */
function monthsUntil(iso?: string): number | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const m =
    (due.getFullYear() - now.getFullYear()) * 12 +
    (due.getMonth() - now.getMonth());
  return m >= 1 ? Math.min(m, MAX_MONTHS) : null;
}

/** "Dec 2026" for `offset` months from now. */
function monthLabel(offset: number): string {
  const d = new Date();
  d.setDate(1); // avoid 31st → next-month overflow
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function LoanPlanner({ loan, onRecorded }: Props) {
  const { currentUser } = useAuth();
  const canEdit = canManageLoans(currentUser?.role);
  const addLoanRepayment = useAppStore((s) => s.addLoanRepayment);

  const [payNow, setPayNow] = useState<number | string>('');
  const [months, setMonths] = useState<number | string>(
    monthsUntil(loan.dueDate) ?? DEFAULT_MONTHS
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loan.status !== 'active') {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        This loan is {loan.status === 'repaid' ? 'fully repaid' : 'written off'}
        {' — '}there is nothing left to plan.
      </Text>
    );
  }

  const summary = loanSummary(loan);
  if (summary.balanceDue < 1) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Nothing is owed on this loan right now.
      </Text>
    );
  }

  // "Pay now" is applied like a real repayment: interest first, then principal.
  const pay = Math.min(Math.max(0, toNumber(payNow) ?? 0), summary.balanceDue);
  const payToInterest = Math.min(pay, summary.interestDue);
  const payToPrincipal = Math.min(pay - payToInterest, summary.principalOutstanding);
  const principalLeft = summary.principalOutstanding - payToPrincipal;
  const interestLeft = summary.interestDue - payToInterest;
  const remaining = principalLeft + interestLeft;

  const n = Math.min(
    MAX_MONTHS,
    Math.max(1, Math.floor(toNumber(months) ?? DEFAULT_MONTHS))
  );
  // Number(): loans saved before the form fix may hold the rate as a string.
  const rate = Number(loan.interestRate) || 0;
  const plan = installmentPlan(principalLeft, interestLeft, rate, n);
  const planTotal = plan.rows.reduce((s, r) => s + r.payment, 0);

  async function recordPayNow() {
    setError(null);
    setBusy(true);
    try {
      const { settled } = await addLoanRepayment(loan.id, {
        date: todayISO(),
        amount: Math.round(pay),
      });
      notifications.show({
        title: settled ? 'Loan fully repaid' : 'Repayment recorded',
        message: `${fmt(pay)} from ${loan.borrowerName}`,
        color: 'teal',
        autoClose: 3000,
      });
      setPayNow('');
      onRecorded?.();
    } catch (e) {
      console.error('Recording repayment failed:', e);
      setError(describeSaveError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <NumberInput
          label="Pay now (optional)"
          description={`Owed today: ${fmt(summary.balanceDue)}`}
          min={0}
          max={Math.round(summary.balanceDue)}
          clampBehavior="strict"
          thousandSeparator
          prefix="Rs "
          placeholder="e.g. 10,000"
          value={payNow}
          onChange={setPayNow}
        />
        <NumberInput
          label="Repay the rest over"
          description={
            loan.dueDate
              ? `Due date ${new Date(loan.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
              : 'Number of monthly installments'
          }
          min={1}
          max={MAX_MONTHS}
          allowDecimal={false}
          suffix={n === 1 ? ' month' : ' months'}
          value={months}
          onChange={setMonths}
        />
      </SimpleGrid>

      {pay > 0 && canEdit && (
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed">
            Paying {fmt(pay)} now leaves {fmt(remaining)} to repay.
          </Text>
          <Button size="xs" variant="light" onClick={recordPayNow} loading={busy}>
            Record {fmt(pay)} as paid today
          </Button>
        </Group>
      )}
      {error && (
        <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      {remaining < 1 ? (
        <Text size="sm" c="dimmed" ta="center">
          Paying {fmt(pay)} now clears the loan completely.
        </Text>
      ) : (
        <>
          <Card withBorder padding="md" radius="md">
            <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="sm">
              <Stack gap={0}>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Monthly installment
                </Text>
                <Text fw={700} size="xl" className="num text-info">
                  {fmt(plan.payment)}
                </Text>
                <Text size="xs" c="dimmed">
                  × {n} month{n === 1 ? '' : 's'}, until {monthLabel(n)}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Interest included
                </Text>
                <Text fw={600} size="lg" className="num">
                  {fmt(plan.totalInterest)}
                </Text>
              </Stack>
              <Stack gap={0}>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Total to pay
                </Text>
                <Text fw={600} size="lg" className="num">
                  {fmt(pay + planTotal)}
                </Text>
                {pay > 0 && (
                  <Text size="xs" c="dimmed">
                    {fmt(pay)} now + {fmt(planTotal)} in installments
                  </Text>
                )}
              </Stack>
            </SimpleGrid>
          </Card>

          <Table.ScrollContainer minWidth={520} maxHeight={320}>
            <Table striped verticalSpacing={6} stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Month</Table.Th>
                  <Table.Th ta="right">Installment</Table.Th>
                  <Table.Th ta="right">Interest</Table.Th>
                  <Table.Th ta="right">Principal</Table.Th>
                  <Table.Th ta="right">Remaining</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {plan.rows.map((r) => (
                  <Table.Tr key={r.month}>
                    <Table.Td>{r.month}</Table.Td>
                    <Table.Td>{monthLabel(r.month)}</Table.Td>
                    <Table.Td ta="right" className="num">
                      {fmt(r.payment)}
                    </Table.Td>
                    <Table.Td ta="right" className="num">
                      {fmt(r.interest)}
                    </Table.Td>
                    <Table.Td ta="right" className="num">
                      {fmt(r.principal)}
                    </Table.Td>
                    <Table.Td ta="right" className="num">
                      {fmt(r.balance)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          <Text size="xs" c="dimmed">
            Estimate at {rate}% a year ({(rate / 12).toFixed(2)}% a month) on
            the remaining principal. Each installment clears interest
            first, then principal. Interest is actually charged daily, so paying
            earlier or later than these months shifts the figures slightly —
            record each payment on the Repayments tab to track the real balance.
          </Text>
        </>
      )}
    </Stack>
  );
}
