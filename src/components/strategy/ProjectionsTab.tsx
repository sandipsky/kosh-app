import {
  Card,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import { IconCircleCheck } from '@tabler/icons-react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { totalFund } from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import { MILESTONES } from './strategyData';

export function ProjectionsTab() {
  const data = useAppStore((s) => s.data);
  const today = totalFund(data);
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = scheme === 'dark';
  const labelColor = isDark ? '#C9CCD3' : '#495057';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: labelColor,
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    stroke: { curve: 'smooth', width: 2, dashArray: [0, 5] },
    dataLabels: { enabled: false },
    legend: {
      position: 'top',
      fontSize: '12px',
      labels: { colors: labelColor },
    },
    xaxis: {
      categories: ['Now', '6 months', 'Year 1', 'Year 2', 'Year 3'],
      labels: { style: { fontSize: '11px', colors: labelColor } },
      axisBorder: { show: false },
      axisTicks: { color: gridColor },
    },
    yaxis: {
      labels: {
        formatter: (v) => `Rs ${Math.round(Number(v) / 1000)}k`,
        style: { fontSize: '11px', colors: labelColor },
      },
    },
    grid: { borderColor: gridColor, strokeDashArray: 3 },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => fmt(v) },
    },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 0.2, opacityFrom: 0.18, opacityTo: 0.02 },
    },
    colors: ['#1D9E75', '#534AB7'],
  };

  const series = [
    {
      name: 'Conservative',
      data: [today, 155000, 190000, 255000, 330000],
    },
    {
      name: 'Optimistic',
      data: [today, 165000, 212000, 305000, 420000],
    },
  ];

  return (
    <Stack gap="md">
      <Card padding="md" radius="md">
        <Stack gap={4} mb="sm">
          <Text size="sm" fw={600} tt="uppercase" c="dimmed">
            Projected fund growth
          </Text>
          <Text size="xs" c="dimmed">
            Assumes 6 members pay Rs 2,000/month · FD at 6.6% · SIP at 13% CAGR ·
            1 IPO allotment/year
          </Text>
        </Stack>
        <ReactApexChart options={options} series={series} type="area" height={260} />
      </Card>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Today
          </Text>
          <Text size="lg" fw={600} className="text-info num">
            {fmt(today)}
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Year 1 (2084)
          </Text>
          <Text size="lg" fw={600} className="text-accent num">
            ~Rs 2,12,000
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Year 2 (2085)
          </Text>
          <Text size="lg" fw={600} className="text-positive num">
            ~Rs 3,05,000
          </Text>
        </Paper>
        <Paper p="md" radius="md" withBorder>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            Year 3 (2086)
          </Text>
          <Text size="lg" fw={600} className="text-positive num">
            ~Rs 4,20,000+
          </Text>
        </Paper>
      </SimpleGrid>

      <Card padding="md" radius="md">
        <Text size="sm" fw={600} mb="sm">
          Key milestones
        </Text>
        <Stack gap={6}>
          {MILESTONES.map((m) => (
            <Group key={m} gap={6} wrap="nowrap" align="flex-start">
              <IconCircleCheck
                size={16}
                color="var(--mantine-color-teal-7)"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
              <Text size="sm" c="dimmed">
                {m}
              </Text>
            </Group>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
