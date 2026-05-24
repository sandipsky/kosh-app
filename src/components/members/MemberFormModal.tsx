import {
  Button,
  Group,
  Modal,
  PasswordInput,
  SegmentedControl,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useEffect } from 'react';
import { GENDER_OPTIONS, ROLE_OPTIONS } from '../../constants/roles';
import {
  initialsFrom,
  pickPaletteByIndex,
} from '../../constants/avatarPalette';
import type { Gender, Member, Role } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  opened: boolean;
  onClose: () => void;
  editing?: Member | null;
}

interface FormValues {
  name: string;
  username: string;
  email: string;
  gender: Gender;
  role: Role;
  password: string;
  confirmPassword: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MemberFormModal({ opened, onClose, editing }: Props) {
  const members = useAppStore((s) => s.data.members);
  const upsertMember = useAppStore((s) => s.upsertMember);

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      username: '',
      email: '',
      gender: 'male',
      role: 'member',
      password: '',
      confirmPassword: '',
    },
    validate: {
      name: (v) => (v.trim().length < 2 ? 'Name must be at least 2 chars' : null),
      username: (v) => {
        const trimmed = v.trim().toLowerCase();
        if (trimmed.length < 3) return 'Username must be at least 3 chars';
        if (!/^[a-z0-9_.-]+$/.test(trimmed)) return 'Only a–z, 0–9, _ . - allowed';
        const dup = members.find(
          (m) => m.username.toLowerCase() === trimmed && m.id !== editing?.id
        );
        return dup ? 'Username is already taken' : null;
      },
      email: (v) => (EMAIL_RE.test(v) ? null : 'Enter a valid email'),
      password: (v) => {
        if (editing && v.length === 0) return null;
        return v.length < 6 ? 'Password must be at least 6 chars' : null;
      },
      confirmPassword: (v, all) =>
        v === all.password ? null : 'Passwords do not match',
    },
  });

  useEffect(() => {
    if (!opened) return;
    if (editing) {
      form.setValues({
        name: editing.name,
        username: editing.username,
        email: editing.email,
        gender: editing.gender,
        role: editing.role,
        password: '',
        confirmPassword: '',
      });
    } else {
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, editing?.id]);

  async function handleSubmit(values: FormValues) {
    const paletteIdx = members.length;
    const palette = editing
      ? { bg: editing.color, fg: editing.fg }
      : pickPaletteByIndex(paletteIdx);
    const password =
      editing && values.password.length === 0 ? editing.password : values.password;

    await upsertMember({
      id: editing?.id,
      name: values.name.trim(),
      username: values.username.trim().toLowerCase(),
      email: values.email.trim(),
      gender: values.gender,
      role: values.role,
      password,
      initials: initialsFrom(values.name),
      color: palette.bg,
      fg: palette.fg,
    });

    notifications.show({
      title: editing ? 'Member updated' : 'Member added',
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
      title={editing ? `Edit ${editing.name}` : 'Add member'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Full name"
            required
            placeholder="e.g. Anish Karki"
            {...form.getInputProps('name')}
          />
          <Group grow>
            <TextInput
              label="Username"
              required
              placeholder="anish"
              {...form.getInputProps('username')}
            />
            <TextInput
              label="Email"
              required
              placeholder="anish@example.com"
              {...form.getInputProps('email')}
            />
          </Group>
          <Group grow align="flex-end">
            <Select
              label="Role"
              required
              data={ROLE_OPTIONS}
              {...form.getInputProps('role')}
            />
            <div>
              <div style={{ marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
                Gender
              </div>
              <SegmentedControl
                fullWidth
                data={GENDER_OPTIONS}
                {...form.getInputProps('gender')}
              />
            </div>
          </Group>
          <Group grow>
            <PasswordInput
              label={editing ? 'New password (optional)' : 'Password'}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              {...form.getInputProps('password')}
            />
            <PasswordInput
              label="Confirm password"
              placeholder="Re-enter password"
              autoComplete="new-password"
              {...form.getInputProps('confirmPassword')}
            />
          </Group>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{editing ? 'Save changes' : 'Add member'}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
