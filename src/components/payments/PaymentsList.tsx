import {
  ActionIcon,
  Button,
  Card,
  Group,
  Pagination,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { canManagePayments } from '../../lib/permissions';
import { MONTHS_ORDER } from '../../constants/months';
import { findMember } from '../../lib/calculations';
import { fmt, formatDate } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import { MemberAvatar } from '../common/MemberAvatar';
import { PaymentFormModal } from './PaymentFormModal';
import type { Payment } from '../../types';

const PAGE_SIZE = 15;

export function PaymentsList() {
  const { currentUser } = useAuth();
  const canEdit = canManagePayments(currentUser?.role);

  const data = useAppStore((s) => s.data);
  const deletePayment = useAppStore((s) => s.deletePayment);

  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () =>
      [...data.payments].sort((a, b) => {
        const dateDiff =
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return MONTHS_ORDER.indexOf(b.month) - MONTHS_ORDER.indexOf(a.month);
      }),
    [data.payments]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function confirmDelete(p: Payment) {
    const m = findMember(data, p.memberId);
    modals.openConfirmModal({
      title: `Delete payment?`,
      children: (
        <Text size="sm">
          Delete {m?.name ?? 'this member'}'s payment for{' '}
          <b>{p.month}</b> ({fmt(p.amount)})?
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deletePayment(p.id),
    });
  }

  return (
    <Stack gap="md">
      <Card padding="md" radius="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <div>
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Recent payments
            </Text>
            <Text size="xs" c="dimmed">
              {sorted.length} total payment{sorted.length === 1 ? '' : 's'}
            </Text>
          </div>
          {canEdit && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setOpened(true)}
              size="sm"
            >
              Add payment
            </Button>
          )}
        </Group>

        {sorted.length === 0 ? (
          <Text c="dimmed" size="sm">
            No payments yet.
          </Text>
        ) : (
          <>
            <Table.ScrollContainer minWidth={620}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Member</Table.Th>
                    <Table.Th>Month / Year</Table.Th>
                    <Table.Th>Payment date</Table.Th>
                    <Table.Th ta="right">Amount</Table.Th>
                    {canEdit && <Table.Th style={{ width: 60 }} />}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pageItems.map((p) => {
                    const m = findMember(data, p.memberId);
                    return (
                      <Table.Tr key={p.id}>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            {m && <MemberAvatar member={m} size={24} />}
                            <Text size="sm">{m?.name ?? p.memberId}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{p.month}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {formatDate(p.paymentDate)}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm" fw={600} className="text-positive num">
                            {fmt(p.amount)}
                          </Text>
                        </Table.Td>
                        {canEdit && (
                          <Table.Td>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              aria-label="Delete payment"
                              onClick={() => confirmDelete(p)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  value={page}
                  onChange={setPage}
                  total={totalPages}
                  size="sm"
                />
              </Group>
            )}
          </>
        )}
      </Card>

      <PaymentFormModal opened={opened} onClose={() => setOpened(false)} />
    </Stack>
  );
}
