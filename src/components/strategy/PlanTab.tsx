import { Badge, Box, Card, Group, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconCertificate,
  IconChartCandle,
  IconRocket,
  IconShieldCheck,
} from '@tabler/icons-react';
import { PLAN_TIERS } from './strategyData';

const ICONS = {
  shield: IconShieldCheck,
  certificate: IconCertificate,
  chart: IconChartCandle,
  rocket: IconRocket,
};

export function PlanTab() {
  return (
    <Stack gap="md">
      {PLAN_TIERS.map((tier) => {
        const Icon = ICONS[tier.icon];
        return (
          <Card key={tier.title} padding="md" radius="md">
            <Group justify="space-between" wrap="wrap" gap="sm" mb="xs">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <ThemeIcon
                  size="lg"
                  radius="md"
                  variant="light"
                  style={{ background: tier.iconBg, color: tier.iconColor }}
                >
                  <Icon size={20} />
                </ThemeIcon>
                <Text fw={600} size="md" truncate>
                  {tier.title}
                </Text>
              </Group>
              <Group gap="xs">
                <Badge
                  variant="light"
                  style={{
                    background: tier.riskBg,
                    color: tier.riskFg,
                    border: 'none',
                  }}
                >
                  {tier.riskTag}
                </Badge>
                <Badge variant="light" color="gray">
                  {tier.amount}
                </Badge>
              </Group>
            </Group>

            <Text size="sm" c="dimmed" mb="sm">
              {tier.description}
            </Text>

            <Progress
              value={tier.pct}
              color="teal"
              size="sm"
              style={{ marginBottom: 4 }}
              styles={{ section: { background: tier.barColor } }}
            />
            <Text size="xs" c="dimmed">
              {tier.pct}% of cash
            </Text>

            {tier.items.length > 0 && (
              <Stack
                gap="xs"
                mt="sm"
                pt="sm"
                style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
              >
                {tier.items.map((item) => (
                  <Group key={item.name} gap="xs" align="flex-start" wrap="nowrap">
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.dot,
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={500}>
                          {item.name}
                        </Text>
                        {item.best && (
                          <Badge size="xs" color="teal" variant="light">
                            Best pick
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {item.detail}
                      </Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            )}
          </Card>
        );
      })}
    </Stack>
  );
}
