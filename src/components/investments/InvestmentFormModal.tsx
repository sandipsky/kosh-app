import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import {
  BS_YEARS,
  currentNepaliMonth,
  currentNepaliYear,
  NEPALI_MONTHS,
} from '../../constants/months';
import { fmt } from '../../lib/formatters';
import { useAppStore } from '../../store/useAppStore';
import type { Investment } from '../../types';

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: Investment | null;
}

interface FormValues {
  name: string;
  description: string;
  type: string;
  manager: string;
  buyMonth: string;
  buyYear: string;
  maturityMonth: string;
  maturityYear: string;
  buyRate: number;
  currentRate: number;
  units: number;
  status: string;
  notes: string;
}

const TYPE_OPTIONS = ['Local IPO', 'Mutual Fund', 'Fixed Deposit', 'Other'];
const STATUS_OPTIONS = ['Applied', 'Allotted', 'Active', 'Matured', 'Sold'];

function splitMonthYear(value: string): { month: string; year: string } {
  const [m, y] = value.split(' ');
  if (m && y) return { month: m, year: y };
  return { month: currentNepaliMonth(), year: String(currentNepaliYear()) };
}

export function InvestmentFormModal({ opened, onClose, editing }: Props) {
  const upsertInvestment = useAppStore((s) => s.upsertInvestment);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      description: '',
      type: 'Local IPO',
      manager: '',
      buyMonth: currentNepaliMonth(),
      buyYear: String(currentNepaliYear()),
      maturityMonth: currentNepaliMonth(),
      maturityYear: String(currentNepaliYear() + 1),
      buyRate: 100,
      currentRate: 100,
      units: 1,
      status: 'Active',
      notes: '',
    },
    validate: {
      name: (v) => (v.trim().length < 2 ? 'Name is required' : null),
      type: (v) => (v ? null : 'Type required'),
      buyRate: (v) => (v > 0 ? null : 'Buy rate must be > 0'),
      currentRate: (v) => (v > 0 ? null : 'Current rate must be > 0'),
      units: (v) => (v > 0 ? null : 'Units must be > 0'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    if (editing) {
      const buy = splitMonthYear(editing.buyDate);
      const mat = splitMonthYear(editing.maturityDate);
      form.setValues({
        name: editing.name,
        description: editing.description,
        type: editing.type,
        manager: editing.manager,
        buyMonth: buy.month,
        buyYear: buy.year,
        maturityMonth: mat.month,
        maturityYear: mat.year,
        buyRate: editing.buyRate,
        currentRate: editing.currentRate,
        units: editing.units,
        status: editing.status,
        notes: editing.notes,
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editing?.id]);

  const totalBuy = (form.values.buyRate || 0) * (form.values.units || 0);
  const totalCurrent = (form.values.currentRate || 0) * (form.values.units || 0);
  const gain = totalCurrent - totalBuy;
  const gainPct = totalBuy > 0 ? Math.round((gain / totalBuy) * 100) : 0;

  async function handleSubmit(values: FormValues) {
    await upsertInvestment({
      id: editing?.id,
      name: values.name.trim(),
      description: values.description,
      type: values.type,
      manager: values.manager,
      buyDate: `${values.buyMonth} ${values.buyYear}`,
      maturityDate: `${values.maturityMonth} ${values.maturityYear}`,
      buyRate: values.buyRate,
      currentRate: values.currentRate,
      units: values.units,
      status: values.status,
      notes: values.notes,
    });
    notifications.show({
      title: editing ? 'Investment updated' : 'Investment added',
      message: values.name,
      color: 'teal',
      autoClose: 2000,
    });
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'Add investment'}
      centered
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Name"
            required
            placeholder="e.g. Solu Hydropower Ltd (SOHL)"
            {...form.getInputProps('name')}
          />
          <Textarea
            label="Description"
            placeholder="Short description"
            autosize
            minRows={2}
            {...form.getInputProps('description')}
          />
          <Group grow>
            <Select label="Type" data={TYPE_OPTIONS} {...form.getInputProps('type')} />
            <Select
              label="Status"
              data={STATUS_OPTIONS}
              {...form.getInputProps('status')}
            />
            <TextInput
              label="Manager"
              placeholder="Anish"
              {...form.getInputProps('manager')}
            />
          </Group>
          <Group grow align="flex-end">
            <Group grow>
              <Select label="Buy month" data={[...NEPALI_MONTHS]} {...form.getInputProps('buyMonth')} />
              <Select label="Buy year" data={BS_YEARS.map((y) => String(y))} {...form.getInputProps('buyYear')} />
            </Group>
            <Group grow>
              <Select label="Maturity month" data={[...NEPALI_MONTHS]} {...form.getInputProps('maturityMonth')} />
              <Select label="Maturity year" data={BS_YEARS.map((y) => String(y))} {...form.getInputProps('maturityYear')} />
            </Group>
          </Group>
          <Group grow>
            <NumberInput
              label="Buy rate (per unit)"
              min={0}
              thousandSeparator
              {...form.getInputProps('buyRate')}
            />
            <NumberInput
              label="Current rate (per unit)"
              min={0}
              thousandSeparator
              {...form.getInputProps('currentRate')}
            />
            <NumberInput
              label="Units"
              min={1}
              {...form.getInputProps('units')}
            />
          </Group>
          <Group grow>
            <TextInput label="Total buy amount" readOnly value={fmt(totalBuy)} />
            <TextInput
              label={`Total current amount (${gainPct >= 0 ? '+' : ''}${gainPct}%)`}
              readOnly
              value={fmt(totalCurrent)}
            />
          </Group>
          <Textarea
            label="Notes"
            placeholder="Optional notes"
            autosize
            minRows={2}
            {...form.getInputProps('notes')}
          />
          <Text size="xs" c="dimmed">
            Current value will be used to compute gain on dashboard and reports.
          </Text>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editing ? 'Save changes' : 'Add investment'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
