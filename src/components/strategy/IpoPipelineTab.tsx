import { Alert, Badge, Card, Paper, Stack, Text } from '@mantine/core';
import { IconBolt, IconBulb } from '@tabler/icons-react';

export function IpoPipelineTab() {
  return (
    <Card padding="md" radius="md">
      <Stack gap="xs" mb="md">
        <Text size="sm" fw={600} tt="uppercase" c="dimmed">
          IPO pipeline — 2082/2083 B.S.
        </Text>
        <Alert color="teal" variant="light" icon={<IconBolt size={16} />}>
          Your SOHL experience (Rs 10,000 → Rs 69,100!) proves hydropower IPOs are
          worth applying to every time.
        </Alert>
      </Stack>

      <Paper
        p="md"
        radius="md"
        withBorder
        style={{
          background:
            'light-dark(var(--mantine-color-teal-0), var(--mantine-color-teal-9))',
          borderColor: 'var(--mantine-color-teal-5)',
        }}
        mb="sm"
      >
        <Stack gap={4}>
          <div>
            <Text
              component="span"
              size="sm"
              fw={600}
              className="text-positive"
            >
              Yambaling Hydropower{' '}
            </Text>
            <Badge size="xs" color="teal" variant="filled">
              Open now
            </Badge>
          </div>
          <Text size="xs" className="text-positive">
            28,00,000 shares · Rs 100 par · Closes Baisakh 22, 2083
          </Text>
          <Text size="xs" className="text-positive">
            <IconBulb
              size={12}
              style={{ verticalAlign: -2, marginRight: 4 }}
            />
            All 6 members apply individually via MeroShare for maximum allotment chances!
          </Text>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder mb="sm">
        <Text size="sm" fw={600}>
          Apollo Hydropower{' '}
          <Badge size="xs" color="orange" variant="light" ml={4}>
            Recently closed
          </Badge>
        </Text>
        <Text size="xs" c="dimmed">
          Closed Baisakh 2–10, 2083 · Rs 100 par · Rating: CARE NP BB-
        </Text>
      </Paper>

      <Paper p="md" radius="md" withBorder mb="sm">
        <Text size="sm" fw={600}>
          More IPOs expected Ashar–Shrawan 2083
        </Text>
        <Text size="xs" c="dimmed">
          Track at:{' '}
          <a href="https://mystocknepal.com/ipoapproved/" target="_blank" rel="noreferrer">
            mystocknepal.com
          </a>{' '}
          ·{' '}
          <a href="https://www.sebon.gov.np/ipo-approved" target="_blank" rel="noreferrer">
            sebon.gov.np
          </a>{' '}
          ·{' '}
          <a href="https://www.investopaper.com" target="_blank" rel="noreferrer">
            investopaper.com
          </a>
        </Text>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Text size="sm" fw={600} mb={4}>
          Smart group IPO strategy
        </Text>
        <Text size="xs" c="dimmed">
          Each of the 6 members applies individually via their own MeroShare with
          Rs 2,000–5,000. This gives 6 separate lottery entries. Pool all
          allotted units under fund records.
        </Text>
      </Paper>
    </Card>
  );
}
