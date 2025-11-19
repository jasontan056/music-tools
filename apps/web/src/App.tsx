import {
  ActionIcon,
  AppShell,
  Avatar,
  Center,
  Container,
  Group,
  Loader,
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

  if (meQuery.error) {
    return <AuthPanel />;
  }

  if (!meQuery.data) {
    return <AuthPanel />;
  }

  const user = meQuery.data;

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Title order={3}>{APP_TITLE}</Title>
            <Text size="sm" c="dimmed">
              Type safe todos with auth
            </Text>
          </Group>
          <Group gap="xs">
            <Avatar radius="xl" color="cyan">
              {user.name?.[0] ?? user.email[0]}
            </Avatar>
            <Stack gap={0}>
              <Text fw={600}>{user.name ?? 'New teammate'}</Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
            </Stack>
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Sign out"
              onClick={() => logout.mutate()}
              loading={logout.isPending}
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md" pb="xl">
          <TodoList user={user} />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default App;
