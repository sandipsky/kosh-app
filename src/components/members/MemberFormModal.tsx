import {
  Alert,
  Button,
  Group,
  Modal,
  PasswordInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconMail } from '@tabler/icons-react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { GENDER_OPTIONS, ROLE_OPTIONS } from '../../constants/roles';
import {
  initialsFrom,
  pickPaletteByIndex,
} from '../../constants/avatarPalette';
import { auth, secondaryAuth } from '../../lib/firebase';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      email: (v) => (EMAIL_RE.test(v.trim()) ? null : 'Enter a valid email'),
      password: (v) => {
        if (editing) return null;
        return v.length < 6 ? 'Password must be at least 6 chars' : null;
      },
      confirmPassword: (v, all) => {
        if (editing) return null;
        return v === all.password ? null : 'Passwords do not match';
      },
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

  async function handleSendReset() {
    if (!editing) return;
    try {
      await sendPasswordResetEmail(auth, editing.email);
      notifications.show({
        title: 'Reset email sent',
        message: `${editing.email} will receive a password-reset link.`,
        color: 'teal',
        icon: <IconCheck size={16} />,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }

  async function handleSubmit(values: FormValues) {
    setError(null);
    setSubmitting(true);
    try {
      const paletteIdx = members.length;
      const palette = editing
        ? { bg: editing.color, fg: editing.fg }
        : pickPaletteByIndex(paletteIdx);

      let id = editing?.id;

      if (!editing) {
        // Create Auth user on the secondary app so we don't lose admin's session.
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          values.email.trim(),
          values.password
        );
        id = cred.user.uid;
        await signOut(secondaryAuth);
      }

      const member: Member = {
        id: id as string,
        name: values.name.trim(),
        username: values.username.trim().toLowerCase(),
        email: values.email.trim(),
        gender: values.gender,
        role: values.role,
        initials: initialsFrom(values.name),
        color: palette.bg,
        fg: palette.fg,
        createdAt: editing?.createdAt ?? new Date().toISOString(),
      };

      await upsertMember(member);

      notifications.show({
        title: editing ? 'Member updated' : 'Member added',
        message: editing
          ? values.name
          : `${values.name} can now log in with ${values.email}.`,
        color: 'teal',
        icon: <IconCheck size={16} />,
        autoClose: 3000,
      });
      onClose();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setError('That email is already registered.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title={editing ? `Edit ${editing.name}` : 'Add member'}
      centered
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} variant="light">
              {error}
            </Alert>
          )}
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
              type="email"
              description={
                editing
                  ? 'Updates contact email only. Login email is unchanged.'
                  : undefined
              }
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
          {editing ? (
            <Button
              variant="default"
              leftSection={<IconMail size={16} />}
              onClick={handleSendReset}
            >
              Send password reset email
            </Button>
          ) : (
            <Group grow>
              <PasswordInput
                label="Initial password"
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
          )}
          {!editing && (
            <Text size="xs" c="dimmed">
              Tell the new member their password — they can change it later via
              "Forgot password?" on the login screen.
            </Text>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Save changes' : 'Add member'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
