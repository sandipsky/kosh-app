import { Card, Text, useComputedColorScheme } from '@mantine/core';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useAppStore } from '../../store/useAppStore';
import {
  cashInBank,
  investmentCurrentValue,
  totalFund,
} from '../../lib/calculations';
import { fmt } from '../../lib/formatters';

export function FundBreakdownChart() {
  const data = useAppStore((s) => s.data);
  const total = totalFund(data);
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = scheme === 'dark';

  const series: number[] = [cashInBank(data), ...data.investments.map(investmentCurrentValue)];
  const labels: string[] = ['Cash in bank', ...data.investments.map((i) => i.name)];

  const labelColor = isDark ? '#C9CCD3' : '#495057';
  const dimmedColor = isDark ? '#909296' : '#868E96';

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      foreColor: labelColor,
      fontFamily: 'inherit',
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    labels,
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: labelColor },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(Number(val))}%`,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => fmt(val) },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '62%',
          background: 'transparent',
          labels: {
            show: true,
            name: { color: dimmedColor, fontSize: '13px' },
            value: { color: labelColor, fontSize: '18px', fontWeight: 600 },
            total: {
              show: true,
              label: 'Total',
              color: dimmedColor,
              formatter: () => fmt(total),
            },
          },
        },
      },
    },
    colors: ['#378ADD', '#1D9E75', '#EF9F27', '#534AB7', '#A32D2D'],
    stroke: {
      width: 2,
      colors: [isDark ? '#1a1b1e' : '#ffffff'],
    },
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { height: 260 }, legend: { fontSize: '11px' } },
      },
    ],
  };

  return (
    <Card padding="md" radius="md" h="100%">
      <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="xs">
        Fund breakdown
      </Text>
      {total > 0 ? (
        <ReactApexChart options={options} series={series} type="donut" height={280} />
      ) : (
        <Text c="dimmed" ta="center" py="xl">
          No data
        </Text>
      )}
    </Card>
  );
}
