import {
  Alert,
  Button,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function LoginModal({ opened, onClose }: Props) {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v.trim().length === 0 ? 'Username required' : null),
      password: (v) => (v.length === 0 ? 'Password required' : null),
    },
  });

  function handleSubmit(values: { username: string; password: string }) {
    const err = login(values.username.trim(), values.password);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    form.reset();
    onClose();
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
            label="Username"
            placeholder="admin"
            autoComplete="username"
            {...form.getInputProps('username')}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...form.getInputProps('password')}
          />
          <Text size="xs" c="dimmed">
            Default admin: <code>admin</code> / <code>admin123</code>
          </Text>
          <Button type="submit" fullWidth>
            Sign in
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
