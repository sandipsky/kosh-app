import {
  AppShell,
  Badge,
  Burger,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBuildingBank } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { NavLinks } from './NavLinks';
import { UserMenu } from './UserMenu';

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] =
    useDisclosure();
  const saving = useAppStore((s) => s.saving);
  const membersCount = useAppStore((s) => s.data.members.length);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="sm"
            />
            <IconBuildingBank size={22} stroke={1.7} />
            <Stack gap={0} visibleFrom="xs">
              <Title order={4} fw={600} lh={1}>
                Kosh
              </Title>
              <Text size="xs" c="dimmed" lh={1}>
                {membersCount} members
              </Text>
            </Stack>
            <Title order={4} fw={600} hiddenFrom="xs">
              Kosh
            </Title>
            {saving && (
              <Badge color="teal" variant="light" size="sm">
                Saving…
              </Badge>
            )}
          </Group>
          <Group gap="xs" wrap="nowrap">
            <ColorSchemeToggle />
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          <NavLinks onNavigate={closeMobile} />
        </AppShell.Section>
        <AppShell.Section>
          <Text size="xs" c="dimmed" ta="center" py="xs">
            Paisa Firta Naaaune Kosh
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
