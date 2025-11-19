import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLogout } from '@tabler/icons-react';
import { APP_TITLE } from '@acme/common';
import { TodoList } from './components/TodoList';
import { AuthPanel } from './components/AuthPanel';
import { useAuth } from './providers/AuthProvider';
import { trpc } from './lib/trpc';

const App = () => {
  const { token, setToken } = useAuth();
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(token),
    retry: false
  });

  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      setToken(null);
      await utils.invalidate();
      notifications.show({ title: 'Signed out', message: 'See you soon!' });
    }
  });

  if (!token) {
    return <AuthPanel />;
  }

  if (meQuery.isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (meQuery.error || !meQuery.data) {
    return <AuthPanel />;
  }

  const user = meQuery.data;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell
      header={{ height: 72 }}
      padding="0"
      bg="var(--mantine-color-gray-0)"
      withBorder={false}
      styles={{
        header: {
          borderBottom: '1px solid rgba(0,0,0,0.04)',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255,255,255,0.9)'
        }
      }}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Stack gap={2}>
              <Text size="sm" c="dimmed">
                {greeting}, {user.name ?? 'there'} 👋
              </Text>
              <Title order={3}>{APP_TITLE}</Title>
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <Avatar radius="xl" color="ocean">
                {user.name?.[0] ?? user.email[0]}
              </Avatar>
              <Stack gap={0} visibleFrom="sm">
                <Text fw={600}>{user.name ?? 'New teammate'}</Text>
                <Group gap={4}>
                  <Text size="xs" c="dimmed">
                    {user.email}
                  </Text>
                  <Badge size="xs" variant="light" color="midnight">
                    {user.role.toLowerCase()}
                  </Badge>
                </Group>
              </Stack>
              <ActionIcon
                variant="light"
                color="red"
                aria-label="Sign out"
                onClick={() => logout.mutate()}
                loading={logout.isPending}
              >
                <IconLogout size={18} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main style={{ background: 'radial-gradient(circle at top, #eff6ff 0%, #fdfdfd 60%)' }}>
        <Container size="lg" py="xl">
          <Stack gap="xl">
            <Paper
              p="xl"
              radius="xl"
              style={{
                background: 'linear-gradient(120deg, #1c7ed6, #7048e8)',
                color: 'white'
              }}
            >
              <Stack gap="xs">
                <Text size="sm" fw={500} c="rgba(255,255,255,0.8)">
                  Plan, prioritize, and ship todos faster
                </Text>
                <Title order={2} c="white">
                  Your personal productivity cockpit
                </Title>
                <Text size="sm" c="rgba(255,255,255,0.8)">
                  Track work-in-progress, capture new tasks, and keep priorities aligned across devices.
                </Text>
              </Stack>
            </Paper>
            <TodoList user={user} />
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default App;
