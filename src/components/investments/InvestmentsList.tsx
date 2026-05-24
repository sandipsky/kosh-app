import { Button, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { canManageInvestments } from '../../lib/permissions';
import { useAppStore } from '../../store/useAppStore';
import { InvestmentCard } from './InvestmentCard';
import { InvestmentFormModal } from './InvestmentFormModal';
import type { Investment } from '../../types';

export function InvestmentsList() {
  const { currentUser } = useAuth();
  const canEdit = canManageInvestments(currentUser?.role);

  const investments = useAppStore((s) => s.data.investments);
  const deleteInvestment = useAppStore((s) => s.deleteInvestment);

  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  function openAdd() {
    setEditing(null);
    setOpened(true);
  }
  function openEdit(i: Investment) {
    setEditing(i);
    setOpened(true);
  }
  function confirmDelete(i: Investment) {
    modals.openConfirmModal({
      title: `Delete ${i.name}?`,
      children: (
        <Text size="sm">
          This will remove this investment from the fund. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteInvestment(i.id),
    });
  }

  return (
    <Stack gap="md">
      <Card padding="md" radius="md">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Text size="sm" fw={600} tt="uppercase" c="dimmed">
              Investments
            </Text>
            <Text size="xs" c="dimmed">
              {investments.length} active position{investments.length === 1 ? '' : 's'}
            </Text>
          </div>
          {canEdit && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openAdd}
              size="sm"
            >
              Add investment
            </Button>
          )}
        </Group>
      </Card>

      {investments.length === 0 ? (
        <Card padding="lg" radius="md">
          <Text c="dimmed" ta="center">
            No investments yet.
            {canEdit ? ' Click "Add investment" to record your first one.' : ''}
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          {investments.map((i) => (
            <InvestmentCard
              key={i.id}
              investment={i}
              onEdit={openEdit}
              onDelete={confirmDelete}
            />
          ))}
        </SimpleGrid>
      )}

      <InvestmentFormModal
        opened={opened}
        onClose={() => setOpened(false)}
        editing={editing}
      />
    </Stack>
  );
}
