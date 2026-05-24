import {
  ActionIcon,
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { canManageMembers } from '../../lib/permissions';
import {
  memberDue,
  memberStatus,
  memberTotal,
} from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import { MemberAvatar } from '../common/MemberAvatar';
import { RoleBadge } from '../common/RoleBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MemberFormModal } from './MemberFormModal';
import type { Member } from '../../types';

export function MembersTable() {
  const { currentUser } = useAuth();
  const canEdit = canManageMembers(currentUser?.role);

  const data = useAppStore((s) => s.data);
  const deleteMember = useAppStore((s) => s.deleteMember);

  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  function openAdd() {
    setEditing(null);
    setOpened(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setOpened(true);
  }

  function confirmDelete(m: Member) {
    modals.openConfirmModal({
      title: `Delete ${m.name}?`,
      children: (
        <Text size="sm">
          This will remove the member <b>{m.name}</b> and all of their
          payments. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteMember(m.id),
    });
  }

  return (
    <Stack gap="md">
      <Card padding="md" radius="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <div>
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Members
            </Text>
            <Text size="xs" c="dimmed">
              {data.members.length} total · Rs {data.monthlyContribution.toLocaleString()} / month
            </Text>
          </div>
          {canEdit && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openAdd}
              size="sm"
            >
              Add member
            </Button>
          )}
        </Group>

        <Table.ScrollContainer minWidth={780}>
          <Table
            verticalSpacing="sm"
            highlightOnHover
            style={{ whiteSpace: 'nowrap' }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>#</Table.Th>
                <Table.Th>Member</Table.Th>
                <Table.Th>Username</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th ta="right">Contributed</Table.Th>
                <Table.Th ta="right">Due</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Role</Table.Th>
                {canEdit && <Table.Th style={{ width: 80 }} />}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.members.map((m, i) => (
                <Table.Tr key={m.id}>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {i + 1}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <MemberAvatar member={m} size={26} />
                      <Text size="sm">{m.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {m.username}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {m.email}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text
                      size="sm"
                      fw={600}
                      className="text-positive num"
                    >
                      {fmt(memberTotal(data, m.id))}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text
                      size="sm"
                      fw={memberDue(data, m.id) > 0 ? 600 : 400}
                      c={memberDue(data, m.id) > 0 ? undefined : 'dimmed'}
                      className={
                        memberDue(data, m.id) > 0
                          ? 'text-negative num'
                          : 'num'
                      }
                    >
                      {fmt(memberDue(data, m.id))}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {m.role === 'admin' ? (
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    ) : (
                      <StatusBadge status={memberStatus(data, m.id)} />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <RoleBadge role={m.role} />
                  </Table.Td>
                  {canEdit && (
                    <Table.Td>
                      <Group gap={4} wrap="nowrap" justify="flex-end">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => openEdit(m)}
                          aria-label={`Edit ${m.name}`}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => confirmDelete(m)}
                          aria-label={`Delete ${m.name}`}
                          disabled={m.id === currentUser?.id}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <MemberFormModal
        opened={opened}
        onClose={() => setOpened(false)}
        editing={editing}
      />
    </Stack>
  );
}
