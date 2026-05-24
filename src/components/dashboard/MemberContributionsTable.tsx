import { Card, Group, Table, Text } from '@mantine/core';
import { useAppStore } from '../../store/useAppStore';
import {
  memberStatus,
  memberTotal,
  totalContrib,
  totalFund,
} from '../../lib/calculations';
import { fmt, pct } from '../../lib/formatters';
import { MemberAvatar } from '../common/MemberAvatar';
import { StatusBadge } from '../common/StatusBadge';

export function MemberContributionsTable() {
  const data = useAppStore((s) => s.data);
  const contribMembers = data.members.filter((m) => m.role !== 'admin');
  const tc = totalContrib(data);
  const tf = totalFund(data);

  return (
    <Card padding="md" radius="md">
      <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="xs">
        Member contributions
      </Text>
      <Table.ScrollContainer minWidth={460}>
        <Table verticalSpacing="xs" highlightOnHover style={{ whiteSpace: 'nowrap' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Member</Table.Th>
              <Table.Th ta="right">Contributed</Table.Th>
              <Table.Th ta="right">Share</Table.Th>
              <Table.Th ta="right">Fund value</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {contribMembers.map((m) => {
              const contributed = memberTotal(data, m.id);
              const share = pct(contributed, tc);
              const fundValue = tc ? (contributed / tc) * tf : 0;
              return (
                <Table.Tr key={m.id}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <MemberAvatar member={m} size={22} />
                      <Text size="sm">{m.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={600} className="text-positive num">
                      {fmt(contributed)}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" className="num" c="dimmed">
                      {share}%
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="sm" fw={600} className="text-accent num">
                      {fmt(fundValue)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={memberStatus(data, m.id)} />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}
