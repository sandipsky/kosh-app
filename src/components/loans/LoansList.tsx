import {
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { canManageLoans } from '../../lib/permissions';
import {
  loansInterestEarned,
  loansOutstandingPrincipal,
  loansReceivable,
} from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import { LoanCard } from './LoanCard';
import { LoanFormModal } from './LoanFormModal';
import type { Loan } from '../../types';

const STATUS_ORDER: Record<Loan['status'], number> = {
  active: 0,
  defaulted: 1,
  repaid: 2,
};

export function LoansList() {
  const { currentUser } = useAuth();
  const canEdit = canManageLoans(currentUser?.role);

  const data = useAppStore((s) => s.data);
  const deleteLoan = useAppStore((s) => s.deleteLoan);

  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);

  const loans = useMemo(
    () =>
      [...data.loans].sort((a, b) => {
        if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status]) {
          return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        }
        return b.issueDate.localeCompare(a.issueDate);
      }),
    [data.loans]
  );

  const outstanding = loansOutstandingPrincipal(data);
  const accruing = loansReceivable(data) - outstanding;
  const earned = loansInterestEarned(data);
  const activeCount = data.loans.filter((l) => l.status === 'active').length;

  function openAdd() {
    setEditing(null);
    setOpened(true);
  }
  function openEdit(l: Loan) {
    setEditing(l);
    setOpened(true);
  }
  function confirmDelete(l: Loan) {
    modals.openConfirmModal({
      title: `Delete loan to ${l.borrowerName}?`,
      children: (
        <Text size="sm">
          This permanently removes the loan record. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteLoan(l.id),
    });
  }

  return (
    <Stack gap="md">
      <Card padding="md" radius="md">
        <Group justify="space-between" wrap="wrap" mb="sm">
          <div>
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Loans
            </Text>
            <Text size="xs" c="dimmed">
              {activeCount} active loan{activeCount === 1 ? '' : 's'}
            </Text>
          </div>
          {canEdit && (
            <Button leftSection={<IconPlus size={16} />} onClick={openAdd} size="sm">
              Give out loan
            </Button>
          )}
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase">
              Out on loan
            </Text>
            <Text fw={600} c="blue">
              {fmt(outstanding)}
            </Text>
          </Stack>
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase">
              Interest accruing
            </Text>
            <Text fw={600} className="text-positive num">
              {fmt(accruing)}
            </Text>
          </Stack>
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase">
              Interest earned
            </Text>
            <Text fw={600} className="text-positive num">
              {fmt(earned)}
            </Text>
          </Stack>
        </SimpleGrid>
      </Card>

      {loans.length === 0 ? (
        <Card padding="lg" radius="md">
          <Text c="dimmed" ta="center">
            No loans yet.
            {canEdit ? ' Click "Give out loan" to record the first one.' : ''}
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {loans.map((l) => (
            <LoanCard
              key={l.id}
              loan={l}
              onEdit={openEdit}
              onDelete={confirmDelete}
            />
          ))}
        </SimpleGrid>
      )}

      <LoanFormModal
        opened={opened}
        onClose={() => setOpened(false)}
        editing={editing}
      />
    </Stack>
  );
}
