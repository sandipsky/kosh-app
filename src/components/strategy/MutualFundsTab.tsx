import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { MUTUAL_FUNDS } from './strategyData';

export function MutualFundsTab() {
  return (
    <Card padding="md" radius="md">
      <Stack gap="xs" mb="md">
        <Text size="sm" fw={600} tt="uppercase" c="dimmed">
          Top mutual funds for SIP — Nepal 2083
        </Text>
        <Text size="xs" c="dimmed">
          Source: Nepalytix · SEBON/AMC NAV data · Min SIP: Rs 500–2,000/month
        </Text>
      </Stack>
      <Stack gap="sm">
        {MUTUAL_FUNDS.map((f, idx) => (
          <div
            key={f.r}
            style={{
              paddingTop: idx === 0 ? 0 : 12,
              borderTop:
                idx === 0
                  ? 'none'
                  : '1px solid var(--mantine-color-gray-2)',
            }}
          >
            <Group gap="xs" mb={4}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--mantine-color-gray-2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--mantine-color-dimmed)',
                }}
              >
                {f.r}
              </span>
              <Text size="sm" fw={600} style={{ flex: 1 }}>
                {f.n}
              </Text>
              {f.pick && (
                <Badge size="xs" color="teal" variant="light">
                  Recommended
                </Badge>
              )}
            </Group>
            <Group gap={6} ml={30} mb={4} wrap="wrap">
              <Badge size="xs" color="blue" variant="light">
                {f.a}
              </Badge>
              <Badge size="xs" color="teal" variant="light">
                {f.c} CAGR
              </Badge>
              <Badge size="xs" color="orange" variant="light">
                {f.ri}
              </Badge>
              <Badge size="xs" color="gray" variant="light">
                Dividend: {f.d}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" ml={30}>
              {f.w}
            </Text>
          </div>
        ))}
      </Stack>
      <Text size="xs" c="dimmed" mt="md">
        Open SIP via MeroShare app or at AMC office. Requires DEMAT + MeroShare
        account.
      </Text>
    </Card>
  );
}
