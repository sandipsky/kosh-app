import { Alert, Tabs } from '@mantine/core';
import {
  IconBuildingBank,
  IconChartCandle,
  IconCircleCheck,
  IconFileText,
  IconListCheck,
  IconTrendingUp,
} from '@tabler/icons-react';
import { FdRatesTab } from './FdRatesTab';
import { IpoPipelineTab } from './IpoPipelineTab';
import { MutualFundsTab } from './MutualFundsTab';
import { PlanTab } from './PlanTab';
import { ProjectionsTab } from './ProjectionsTab';

export function StrategyTabs() {
  return (
    <>
      <Alert color="teal" variant="light" icon={<IconCircleCheck size={16} />} mb="md">
        Based on real Nepal market data — Jestha 2083. Actual fund names, current FD
        rates, live IPO pipeline.
      </Alert>
      <Tabs defaultValue="plan" keepMounted={false}>
        <Tabs.List style={{ flexWrap: 'wrap' }}>
          <Tabs.Tab value="plan" leftSection={<IconListCheck size={14} />}>
            Plan
          </Tabs.Tab>
          <Tabs.Tab value="fd" leftSection={<IconBuildingBank size={14} />}>
            FD rates
          </Tabs.Tab>
          <Tabs.Tab value="mf" leftSection={<IconChartCandle size={14} />}>
            Mutual funds
          </Tabs.Tab>
          <Tabs.Tab value="ipo" leftSection={<IconFileText size={14} />}>
            IPO pipeline
          </Tabs.Tab>
          <Tabs.Tab value="proj" leftSection={<IconTrendingUp size={14} />}>
            Projections
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="plan" pt="md">
          <PlanTab />
        </Tabs.Panel>
        <Tabs.Panel value="fd" pt="md">
          <FdRatesTab />
        </Tabs.Panel>
        <Tabs.Panel value="mf" pt="md">
          <MutualFundsTab />
        </Tabs.Panel>
        <Tabs.Panel value="ipo" pt="md">
          <IpoPipelineTab />
        </Tabs.Panel>
        <Tabs.Panel value="proj" pt="md">
          <ProjectionsTab />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
