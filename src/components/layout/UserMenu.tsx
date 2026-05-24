import { Button, Menu, Text } from '@mantine/core';
import { IconLogin, IconLogout, IconUser } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginModal } from '../common/LoginModal';
import { MemberAvatar } from '../common/MemberAvatar';
import { ROLE_LABELS } from '../../constants/roles';

export function UserMenu() {
  const { currentUser, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (!currentUser) {
    return (
      <>
        <Button
          leftSection={<IconLogin size={16} />}
          variant="default"
          onClick={() => setLoginOpen(true)}
          size="sm"
        >
          Log in
        </Button>
        <LoginModal opened={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Menu.Target>
        <Button variant="subtle" size="sm" leftSection={<MemberAvatar member={currentUser} size={22} />}>
          {currentUser.name}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Text size="xs">Signed in as</Text>
          <Text size="sm" fw={600}>
            {currentUser.username}
          </Text>
          <Text size="xs" c="dimmed">
            {ROLE_LABELS[currentUser.role]}
          </Text>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item leftSection={<IconUser size={14} />} disabled>
          Profile (coming soon)
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          onClick={logout}
        >
          Log out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
