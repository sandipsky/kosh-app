import { Stack } from '@mantine/core';
import { StrategyTabs } from '../components/strategy/StrategyTabs';

export function StrategyPage() {
  return (
    <Stack gap="md">
      <StrategyTabs />
    </Stack>
  );
}
