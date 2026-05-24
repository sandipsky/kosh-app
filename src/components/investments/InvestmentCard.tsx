import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconBolt,
  IconEdit,
  IconLock,
  IconTrash,
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { canManageInvestments } from '../../lib/permissions';
import {
  investmentCurrentValue,
  investmentInvested,
} from '../../lib/calculations';
import { fmt, pct } from '../../lib/formatters';
import type { Investment } from '../../types';

interface Props {
  investment: Investment;
  onEdit: (i: Investment) => void;
  onDelete: (i: Investment) => void;
}

export function InvestmentCard({ investment, onEdit, onDelete }: Props) {
  const { currentUser } = useAuth();
  const canEdit = canManageInvestments(currentUser?.role);

  const invested = investmentInvested(investment);
  const current = investmentCurrentValue(investment);
  const gain = current - invested;
  const gainPct = pct(gain, invested || 1);
  const positive = gain >= 0;

  return (
    <Card padding="md" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
          <ThemeIcon color="grape" variant="light" size="lg" radius="md">
            <IconBolt size={18} />
          </ThemeIcon>
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="wrap">
              <Text fw={600} size="sm" truncate>
                {investment.name}
              </Text>
              <Badge size="xs" color="blue" variant="light">
                {investment.type}
              </Badge>
              <Badge size="xs" color="gray" variant="light">
                {investment.status}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              {investment.units} units · Buy {investment.buyDate} · Manager:{' '}
              {investment.manager || '—'}
            </Text>
            {investment.maturityDate && (
              <Group gap={4} className="text-warning">
                <IconLock size={12} />
                <Text size="xs">Lock-in until {investment.maturityDate}</Text>
              </Group>
            )}
          </Stack>
        </Group>
        {canEdit && (
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="blue"
              aria-label="Edit investment"
              onClick={() => onEdit(investment)}
            >
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Delete investment"
              onClick={() => onDelete(investment)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      <Group justify="space-between" mt="md" wrap="wrap" gap="sm">
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Invested
          </Text>
          <Text fw={600} size="md">
            {fmt(invested)}
          </Text>
          <Text size="xs" c="dimmed">
            @ Rs {investment.buyRate}/unit
          </Text>
        </Stack>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Current
          </Text>
          <Text
            fw={600}
            size="md"
            className={positive ? 'text-positive num' : 'text-negative num'}
          >
            {fmt(current)}
          </Text>
          <Text size="xs" c="dimmed">
            @ Rs {investment.currentRate}/unit
          </Text>
        </Stack>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Gain
          </Text>
          <Group gap={4} align="baseline">
            {positive ? (
              <IconTrendingUp size={16} color="var(--kosh-positive)" />
            ) : (
              <IconTrendingDown size={16} color="var(--kosh-negative)" />
            )}
            <Text
              fw={600}
              size="md"
              className={positive ? 'text-positive num' : 'text-negative num'}
            >
              {positive ? '+' : ''}
              {gainPct}%
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {fmt(gain)}
          </Text>
        </Stack>
      </Group>

      {investment.description && (
        <Text size="sm" c="dimmed" mt="sm">
          {investment.description}
        </Text>
      )}
      {investment.notes && (
        <Text size="xs" c="dimmed" mt="xs">
          <b>Notes:</b> {investment.notes}
        </Text>
      )}
    </Card>
  );
}
