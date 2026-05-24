import { Card, Text, useComputedColorScheme } from '@mantine/core';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useAppStore } from '../../store/useAppStore';
import { monthlyTotals } from '../../lib/calculations';
import { fmt } from '../../lib/formatters';

export function ContributionsBarChart() {
  const data = useAppStore((s) => s.data);
  const totals = monthlyTotals(data);
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = scheme === 'dark';

  const labels = totals.map((t) => t.month.replace(' 20', " '"));
  const values = totals.map((t) => t.total);

  const labelColor = isDark ? '#C9CCD3' : '#495057';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: labelColor,
    },
    theme: { mode: isDark ? 'dark' : 'light' },
    plotOptions: {
      bar: { columnWidth: '55%', borderRadius: 4 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      labels: {
        style: { fontSize: '10px', colors: labelColor },
        rotate: -35,
        rotateAlways: true,
      },
      axisBorder: { show: false },
      axisTicks: { color: gridColor },
    },
    yaxis: {
      labels: {
        formatter: (v) => `Rs ${Math.round(Number(v) / 1000)}k`,
        style: { fontSize: '10px', colors: labelColor },
      },
    },
    grid: { borderColor: gridColor, strokeDashArray: 3 },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (v) => fmt(v) },
    },
    colors: ['#1D9E75'],
  };

  return (
    <Card padding="md" radius="md" h="100%">
      <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="xs">
        Monthly collection
      </Text>
      <ReactApexChart
        options={options}
        series={[{ name: 'Collected', data: values }]}
        type="bar"
        height={280}
      />
    </Card>
  );
}
