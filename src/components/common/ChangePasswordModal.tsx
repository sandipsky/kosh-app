import {
  Alert,
  Button,
  Modal,
  PasswordInput,
  Stack,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../../lib/firebase';

interface Props {
  opened: boolean;
  onClose: () => void;
}

interface FormValues {
  current: string;
  next: string;
  confirm: string;
}

export function ChangePasswordModal({ opened, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { current: '', next: '', confirm: '' },
    validate: {
      current: (v) => (v.length === 0 ? 'Required' : null),
      next: (v) =>
        v.length < 6 ? 'Password must be at least 6 characters' : null,
      confirm: (v, all) =>
        v === all.next ? null : 'Passwords do not match',
    },
  });

  function handleClose() {
    form.reset();
    setError(null);
    onClose();
  }

  async function handleSubmit(values: FormValues) {
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('Not signed in.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, values.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, values.next);
      notifications.show({
        title: 'Password updated',
        message: 'Use the new password next time you log in.',
        color: 'teal',
        icon: <IconCheck size={16} />,
        autoClose: 3000,
      });
      handleClose();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Current password is incorrect.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak (must be at least 6 characters).');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
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
      onClose={handleClose}
      title="Change password"
      centered
      size="sm"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} variant="light">
              {error}
            </Alert>
          )}
          <PasswordInput
            label="Current password"
            required
            autoComplete="current-password"
            {...form.getInputProps('current')}
          />
          <PasswordInput
            label="New password"
            required
            placeholder="At least 6 characters"
            autoComplete="new-password"
            {...form.getInputProps('next')}
          />
          <PasswordInput
            label="Confirm new password"
            required
            autoComplete="new-password"
            {...form.getInputProps('confirm')}
          />
          <Button type="submit" loading={submitting} fullWidth>
            Update password
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
