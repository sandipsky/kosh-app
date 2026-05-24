import { Card, Group, Table, Text } from '@mantine/core';
import { useAppStore } from '../../store/useAppStore';
import { findMember, recentPayments } from '../../lib/calculations';
import { fmt, formatDate } from '../../lib/formatters';
import { MemberAvatar } from '../common/MemberAvatar';

export function RecentPaymentsTable() {
  const data = useAppStore((s) => s.data);
  const items = recentPayments(data, 8);

  return (
    <Card padding="md" radius="md">
      <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="xs">
        Recent payments
      </Text>
      {items.length === 0 ? (
        <Text c="dimmed" size="sm">
          No payments yet
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={420}>
          <Table verticalSpacing="xs" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Member</Table.Th>
                <Table.Th>Month</Table.Th>
                <Table.Th>Paid on</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((p) => {
                const m = findMember(data, p.memberId);
                return (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        {m && <MemberAvatar member={m} size={22} />}
                        <Text size="sm">{m?.name ?? p.memberId}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {p.month}
                      </Text>
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
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Card>
  );
}
