import {
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconBuildingBank,
  IconCheck,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
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
    <Center h="100vh" px="md">
      <Card withBorder shadow="sm" radius="md" p="xl" w="100%" maw={380}>
        <Stack gap="lg">
          <Stack gap={4} align="center">
            <Group gap="xs">
              <IconBuildingBank size={26} stroke={1.7} />
              <Title order={3} fw={600}>
                Kosh
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              Sign in to continue
            </Text>
          </Stack>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="light"
                >
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
        </Stack>
      </Card>
    </Center>
  );
}
