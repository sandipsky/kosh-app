import { Badge, Card, Stack, Table, Text } from '@mantine/core';
import { FD_RATES } from './strategyData';

export function FdRatesTab() {
  return (
    <Card padding="md" radius="md">
      <Stack gap="xs" mb="md">
        <Text size="sm" fw={600} tt="uppercase" c="dimmed">
          FD rates — Nepal 2083 B.S.
        </Text>
        <Text size="xs" c="dimmed">
          Source: sharegyannepal.com · Verified Jestha 2083 · 5% TDS deducted on interest.
        </Text>
      </Stack>
      <Table.ScrollContainer minWidth={380}>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Bank</Table.Th>
              <Table.Th>Rate (1 yr)</Table.Th>
              <Table.Th>Class</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {FD_RATES.map((r) => (
              <Table.Tr key={r.bank}>
                <Table.Td>
                  <Text size="sm" component="span">
                    {r.bank}
                  </Text>{' '}
                  {r.best && (
                    <Badge size="xs" color="teal" variant="light" ml={4}>
                      Best
                    </Badge>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text
                    size="sm"
                    fw={600}
                    c={r.rate.includes('6.6') || r.high ? 'teal.8' : undefined}
                  >
                    {r.rate}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {r.class}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Text size="xs" c="dimmed" mt="md">
        Rates change quarterly. Verify at{' '}
        <a
          href="https://www.sharegyannepal.com/fixed-deposit-interest-rate-in-nepal/"
          target="_blank"
          rel="noreferrer"
        >
          sharegyannepal.com
        </a>{' '}
        before opening FD.
      </Text>
    </Card>
  );
}
