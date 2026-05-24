import { Card, Group, Text } from '@mantine/core';
import { useMemo } from 'react';
import { allKoshMonths, isContributingMember } from '../../lib/calculations';
import { fmt } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import { MemberAvatar } from '../common/MemberAvatar';

export function ContributionsGrid() {
  const data = useAppStore((s) => s.data);

  const contribMembers = useMemo(
    () => data.members.filter(isContributingMember),
    [data.members]
  );

  const months = useMemo(() => allKoshMonths(), []);

  const grandTotalByMember = useMemo(
    () =>
      Object.fromEntries(
        contribMembers.map((m) => [
          m.id,
          data.payments
            .filter((p) => p.memberId === m.id)
            .reduce((s, p) => s + p.amount, 0),
        ])
      ),
    [contribMembers, data.payments]
  );

  const grandTotal = useMemo(
    () => data.payments.reduce((s, p) => s + p.amount, 0),
    [data.payments]
  );

  return (
    <Card padding="md" radius="md">
      <Text size="sm" fw={600} tt="uppercase" c="dimmed" mb="xs">
        Contributions by month
      </Text>
      <Text size="xs" c="dimmed" mb="md">
        First column and bottom row stay visible while scrolling.
      </Text>

      <div className="sticky-table-wrap">
        <table className="sticky-table">
          <thead>
            <tr>
              <th className="sticky-col">Month</th>
              {contribMembers.map((m) => (
                <th key={m.id} style={{ textAlign: 'right' }}>
                  <Group gap={6} wrap="nowrap" justify="flex-end">
                    <MemberAvatar member={m} size={20} />
                    <span>{m.name}</span>
                  </Group>
                </th>
              ))}
              <th style={{ textAlign: 'right' }}>Monthly total</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => {
              const rowTotal = data.payments
                .filter((p) => p.month === month)
                .reduce((s, p) => s + p.amount, 0);
              return (
                <tr key={month}>
                  <td className="sticky-col">{month}</td>
                  {contribMembers.map((m) => {
                    const pay = data.payments.find(
                      (p) => p.memberId === m.id && p.month === month
                    );
                    return (
                      <td key={m.id} style={{ textAlign: 'right' }}>
                        {pay ? (
                          <Text
                            component="span"
                            size="sm"
                            fw={600}
                            className="text-positive num"
                          >
                            {fmt(pay.amount)}
                          </Text>
                        ) : (
                          <Text
                            component="span"
                            size="sm"
                            className="text-negative"
                          >
                            —
                          </Text>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {fmt(rowTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky-col">Grand total</td>
              {contribMembers.map((m) => (
                <td key={m.id} style={{ textAlign: 'right' }}>
                  {fmt(grandTotalByMember[m.id] ?? 0)}
                </td>
              ))}
              <td style={{ textAlign: 'right' }}>{fmt(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
