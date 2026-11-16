import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { loanSummary } from '../../lib/calculations';
import { describeSaveError } from '../../lib/errors';
import { fmt, formatDate, todayISO, toNumber } from '../../lib/formatters';
import { canManageLoans } from '../../lib/permissions';
import { useAppStore } from '../../store/useAppStore';
import type { Loan } from '../../types';

const PREVIEW_ID = '__preview__';

interface Props {
  loan: Loan;
}

export function LoanRepayments({ loan }: Props) {
  const { currentUser } = useAuth();
  const canEdit = canManageLoans(currentUser?.role);
  const addLoanRepayment = useAppStore((s) => s.addLoanRepayment);
  const deleteLoanRepayment = useAppStore((s) => s.deleteLoanRepayment);

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState<number | string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = loan.status === 'active';
  const summary = loanSummary(loan);
  // Newest first for display.
  const rows = [...summary.rows].reverse();

  // Preview how the entered amount would be applied on the chosen date. Run
  // even with a zero amount so we know the balance owed on that date (a
  // back-dated payment owes less interest than one made today).
  const amountNum = toNumber(amount) ?? 0;
  const ledgerRow = date
    ? loanSummary({
        ...loan,
        repayments: [
          ...(loan.repayments ?? []),
          { id: PREVIEW_ID, date, amount: Math.max(0, amountNum) },
        ],
      }).rows.find((r) => r.repayment.id === PREVIEW_ID)
    : undefined;
  const balanceOnDate = ledgerRow
    ? ledgerRow.balanceAfter + ledgerRow.toInterest + ledgerRow.toPrincipal
    : summary.balanceDue;
  const previewRow = amountNum > 0 ? ledgerRow : undefined;
  // Allow a rupee of slack for rounding of the displayed balance.
  const overpaying = !!previewRow && amountNum > balanceOnDate + 1;

  async function handleRecord() {
    if (!date) {
      setError('Pick the date the money was received.');
      return;
    }
    if (date > todayISO()) {
      setError("The payment date can't be in the future.");
      return;
    }
    if (amountNum <= 0) {
      setError('Enter the amount received.');
      return;
    }
    if (overpaying) {
      setError(
        `That's more than the ${fmt(balanceOnDate)} owed on ${formatDate(date)}.`
      );
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { settled } = await addLoanRepayment(loan.id, {
        date,
        amount: amountNum,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      notifications.show({
        title: settled ? 'Loan fully repaid' : 'Repayment recorded',
        message: settled
          ? `${loan.borrowerName}'s loan is now marked as repaid.`
          : `${fmt(amountNum)} from ${loan.borrowerName}`,
        color: 'teal',
        autoClose: 3000,
      });
      setAmount('');
      setNote('');
      setDate(todayISO());
    } catch (e) {
      console.error('Recording repayment failed:', e);
      setError(describeSaveError(e));
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete(repaymentId: string, label: string) {
    modals.openConfirmModal({
      title: 'Delete this repayment?',
      children: (
        <Text size="sm">
          Removes the {label} repayment. The loan balance will be recalculated.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteLoanRepayment(loan.id, repaymentId);
        } catch (e) {
          notifications.show({
            title: "Couldn't delete repayment",
            message: describeSaveError(e),
            color: 'red',
          });
        }
      },
    });
  }

  return (
    <Stack gap="md">
      {canEdit && isActive && (
        <Card withBorder padding="sm" radius="md">
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Record a repayment
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <TextInput
                type="date"
                label="Received on"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.currentTarget.value)}
              />
              <NumberInput
                label="Amount"
                min={0}
                thousandSeparator
                prefix="Rs "
                placeholder="e.g. 10,000"
                value={amount}
                onChange={setAmount}
                error={overpaying ? `Max ${fmt(balanceOnDate)}` : undefined}
              />
              <TextInput
                label="Note (optional)"
                placeholder="e.g. cash, eSewa"
                value={note}
                onChange={(e) => setNote(e.currentTarget.value)}
              />
            </SimpleGrid>

            {previewRow && !overpaying && (
              <Text size="xs" c="dimmed">
                {previewRow.toInterest > 0 && (
                  <>
                    {fmt(previewRow.toInterest)} clears interest
                    {previewRow.toPrincipal > 0 ? ', ' : '. '}
                  </>
                )}
                {previewRow.toPrincipal > 0 && (
                  <>{fmt(previewRow.toPrincipal)} reduces the principal. </>
                )}
                Balance after this payment:{' '}
                <b>{fmt(previewRow.balanceAfter)}</b>
                {previewRow.balanceAfter < 1 && ' (loan will be marked repaid)'}
              </Text>
            )}

            {error && (
              <Alert
                color="red"
                variant="light"
                icon={<IconAlertCircle size={16} />}
              >
                {error}
              </Alert>
            )}

            <Group justify="space-between">
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setAmount(Math.round(balanceOnDate))}
                disabled={balanceOnDate < 1}
              >
                Pay full balance ({fmt(balanceOnDate)})
              </Button>
              <Button onClick={handleRecord} loading={busy}>
                Record repayment
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      {!isActive && canEdit && (
        <Text size="xs" c="dimmed">
          This loan is closed. To record more installments, edit the loan and
          set its status back to Active.
        </Text>
      )}

      {rows.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No repayments recorded yet.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={560}>
          <Table striped highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th ta="right">Paid</Table.Th>
                <Table.Th ta="right">To interest</Table.Th>
                <Table.Th ta="right">To principal</Table.Th>
                <Table.Th ta="right">Balance after</Table.Th>
                {canEdit && isActive && <Table.Th />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r) => (
                <Table.Tr key={r.repayment.id}>
                  <Table.Td>
                    <Text size="sm">{formatDate(r.repayment.date)}</Text>
                    {r.repayment.note && (
                      <Text size="xs" c="dimmed">
                        {r.repayment.note}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="right" className="num text-positive">
                    {fmt(r.repayment.amount)}
                  </Table.Td>
                  <Table.Td ta="right" className="num">
                    {fmt(r.toInterest)}
                  </Table.Td>
                  <Table.Td ta="right" className="num">
                    {fmt(r.toPrincipal)}
                  </Table.Td>
                  <Table.Td ta="right" className="num">
                    {fmt(r.balanceAfter)}
                  </Table.Td>
                  {canEdit && isActive && (
                    <Table.Td ta="right">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="Delete repayment"
                        onClick={() =>
                          confirmDelete(
                            r.repayment.id,
                            `${fmt(r.repayment.amount)} on ${formatDate(r.repayment.date)}`
                          )
                        }
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
