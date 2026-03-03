import {
  ActionIcon,
  AppShell,
  Avatar,
  Badge,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLogout, IconLogin } from '@tabler/icons-react';
import { useState } from 'react';
import { APP_TITLE } from '@acme/common';
import { TriadExplorer } from './components/triadExplorer';
import { AuthPanel } from './components/AuthPanel';
import { useAuth } from './providers/AuthProvider';
import { trpc } from './lib/trpc';

const App = () => {
  const { token, setToken } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
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

  // If user wants to sign in, show the auth panel
  if (showAuth && !token) {
    return <AuthPanel />;
  }

  // If user is logged in and data is loading
  if (token && meQuery.isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  const user = meQuery.data;

  return (
    <>
      <TriadExplorer />
    </>
  );
};

export default App;
