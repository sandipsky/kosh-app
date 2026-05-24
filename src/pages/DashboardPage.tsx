import { Grid, Stack } from '@mantine/core';
import { ContributionsBarChart } from '../components/dashboard/ContributionsBarChart';
import { FundBreakdownChart } from '../components/dashboard/FundBreakdownChart';
import { KpiGrid } from '../components/dashboard/KpiGrid';
import { MemberContributionsTable } from '../components/dashboard/MemberContributionsTable';
import { RecentPaymentsTable } from '../components/dashboard/RecentPaymentsTable';
import { UpdateFundValuesCard } from '../components/dashboard/UpdateFundValuesCard';

export function DashboardPage() {
  return (
    <Stack gap="md">
      <KpiGrid />
      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <FundBreakdownChart />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <ContributionsBarChart />
        </Grid.Col>
      </Grid>
      <Grid>
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <RecentPaymentsTable />
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
          <MemberContributionsTable />
        </Grid.Col>
      </Grid>
      <UpdateFundValuesCard />
    </Stack>
  );
}
