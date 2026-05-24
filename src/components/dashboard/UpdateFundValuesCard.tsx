import {
  ActionIcon,
  Card,
  Group,
  NumberInput,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { canUpdateFundValues } from '../../lib/permissions';
import { useAppStore } from '../../store/useAppStore';

export function UpdateFundValuesCard() {
  const { currentUser } = useAuth();
  const data = useAppStore((s) => s.data);
  const setCashInBank = useAppStore((s) => s.setCashInBank);
  const setInvestmentRate = useAppStore((s) => s.setInvestmentRate);

  const [cash, setCash] = useState<number | string>(data.cashInBank);
  const sohl = data.investments.find((i) => i.name.includes('SOHL'));
  const [sohlPrice, setSohlPrice] = useState<number | string>(
    sohl?.currentRate ?? 0
  );

  if (!canUpdateFundValues(currentUser?.role)) return null;

  async function save() {
    const c = Number(cash);
    const p = Number(sohlPrice);
    if (!Number.isNaN(c) && c >= 0) await setCashInBank(c);
    if (sohl && !Number.isNaN(p) && p > 0) await setInvestmentRate(sohl.id, p);
    notifications.show({
      title: 'Updated',
      message: 'Fund values saved',
      color: 'teal',
      icon: <IconCheck size={16} />,
      autoClose: 2000,
    });
  }

  return (
    <Card padding="md" radius="md">
      <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="xs">
        Update fund values
      </Text>
      <Stack gap="sm">
        <Group grow align="flex-end" wrap="wrap">
          <NumberInput
            label="Cash in bank (Rs)"
            value={cash}
            onChange={setCash}
            min={0}
            thousandSeparator
            allowDecimal={false}
          />
          {sohl && (
            <NumberInput
              label={`${sohl.name} price`}
              value={sohlPrice}
              onChange={setSohlPrice}
              min={1}
              thousandSeparator
              allowDecimal={false}
            />
          )}
          <Tooltip label="Save fund values">
            <ActionIcon
              size="lg"
              variant="filled"
              color="teal"
              onClick={save}
              aria-label="Save fund values"
            >
              <IconCheck size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Text size="xs" c="dimmed">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </Text>
      </Stack>
    </Card>
  );
}
