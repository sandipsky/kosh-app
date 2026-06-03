import { Card, Group, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCash,
  IconChartLine,
  IconCoin,
  IconPigMoney,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { fmt, pct } from '../../lib/formatters';
import {
  cashInBank,
  loansOutstandingPrincipal,
  pendingDues,
  totalFund,
  totalInvestmentsInvested,
  totalInvestmentsValue,
} from '../../lib/calculations';
import { useAppStore } from '../../store/useAppStore';

interface Kpi {
  label: string;
  value: ReactNode;
  color: string;
  icon: typeof IconCash;
}

export function KpiGrid() {
  const data = useAppStore((s) => s.data);

  const invested = totalInvestmentsInvested(data);
  const invValue = totalInvestmentsValue(data);
  const gain = invValue - invested;
  const gainPct = pct(gain, invested || 1);

  const kpis: Kpi[] = [
    {
      label: 'Total fund value',
      value: fmt(totalFund(data)),
      color: 'teal',
      icon: IconWallet,
    },
    {
      label: 'Cash in bank',
      value: fmt(cashInBank(data)),
      color: 'blue',
      icon: IconCash,
    },
    {
      label: 'Invested amount',
      value: fmt(invested),
      color: 'grape',
      icon: IconCoin,
    },
    {
      label: 'Invested (current)',
      value: fmt(invValue),
      color: 'indigo',
      icon: IconChartLine,
    },
    {
      label: 'Gain',
      value: `${gain >= 0 ? '+' : ''}${gainPct}%`,
      color: gain >= 0 ? 'teal' : 'red',
      icon: IconTrendingUp,
    },
    {
      label: 'Out on loan',
      value: fmt(loansOutstandingPrincipal(data)),
      color: 'orange',
      icon: IconPigMoney,
    },
    {
      label: 'Pending dues',
      value: fmt(pendingDues(data)),
      color: 'red',
      icon: IconAlertTriangle,
    },
  ];

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="sm">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label} padding="md" radius="md">
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <div style={{ minWidth: 0 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} lh={1.2}>
                  {k.label}
                </Text>
                <Text size="lg" fw={600} mt={6} c={k.color} truncate>
                  {k.value}
                </Text>
              </div>
              <ThemeIcon color={k.color} variant="light" size="lg" radius="md">
                <Icon size={18} stroke={1.7} />
              </ThemeIcon>
            </Group>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
