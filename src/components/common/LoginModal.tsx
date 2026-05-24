import {
  Alert,
  Anchor,
  Button,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginModal({ opened, onClose }: Props) {
  const { login, sendPasswordReset } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => (EMAIL_RE.test(v.trim()) ? null : 'Enter a valid email'),
      password: (v) => (v.length === 0 ? 'Password required' : null),
    },
  });

  async function handleSubmit(values: { email: string; password: string }) {
    setSubmitting(true);
    const err = await login(values.email, values.password);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    form.reset();
    onClose();
  }

  async function handleReset() {
    const email = form.values.email.trim();
    if (!EMAIL_RE.test(email)) {
      setError('Enter your email above first, then click reset.');
      return;
    }
    setResetting(true);
    const err = await sendPasswordReset(email);
    setResetting(false);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    notifications.show({
      title: 'Reset email sent',
      message: `Check ${email} for the reset link.`,
      color: 'teal',
      icon: <IconCheck size={16} />,
      autoClose: 4000,
    });
  }

  return (
    <Modal
      opened={opened}
      onClose={() => {
        form.reset();
        setError(null);
        onClose();
      }}
      title="Log in"
      centered
      size="sm"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}
          <TextInput
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            type="email"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...form.getInputProps('password')}
          />
          <Anchor
            component="button"
            type="button"
            size="xs"
            c="dimmed"
            onClick={handleReset}
            disabled={resetting}
            style={{ alignSelf: 'flex-end' }}
          >
            {resetting ? 'Sending…' : 'Forgot password?'}
          </Anchor>
          <Button type="submit" fullWidth loading={submitting}>
            Sign in
          </Button>
          <Text size="xs" c="dimmed" ta="center">
            Don't have an account? Ask an admin to invite you.
          </Text>
        </Stack>
      </form>
    </Modal>
  );
}
