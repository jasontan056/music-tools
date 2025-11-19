import {
  Anchor,
  Button,
  Center,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { APP_TITLE } from '@acme/common';
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth } from '../providers/AuthProvider';

export const AuthPanel = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const { setToken } = useAuth();
  const utils = trpc.useUtils();

  const loginForm = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (!/^\S+@\S+$/.test(value) ? 'Please enter a valid email' : null),
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null)
    }
  });

  const registerForm = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name: (value) => (value.length < 2 ? 'Name is too short' : null),
      email: (value) => (!/^\S+@\S+$/.test(value) ? 'Please enter a valid email' : null),
      password: (value) => (value.length < 8 ? 'Password must be at least 8 characters' : null)
    }
  });

  const login = trpc.auth.login.useMutation({
    onSuccess: async (payload) => {
      setToken(payload.token);
      await utils.invalidate();
      notifications.show({ title: 'Welcome back', message: `Logged in as ${payload.user.email}` });
    },
    onError: (error) => {
      notifications.show({ title: 'Login failed', message: error.message, color: 'red' });
    }
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: async (payload) => {
      setToken(payload.token);
      await utils.invalidate();
      notifications.show({ title: 'Account created', message: 'Let’s build a better todo list!' });
    },
    onError: (error) => {
      notifications.show({ title: 'Unable to create account', message: error.message, color: 'red' });
    }
  });

  return (
    <Center h="100vh" px="md">
      <Paper withBorder shadow="md" p="xl" radius="lg" w={420} bg="var(--mantine-color-body)">
        <Stack gap="xs" mb="lg" ta="center">
          <Title order={3}>{APP_TITLE}</Title>
          <Text c="dimmed">Sign in or create an account to manage your todos</Text>
        </Stack>
        <Tabs value={tab} onChange={(value) => setTab((value as typeof tab) ?? 'login')} variant="outline">
          <Tabs.List grow>
            <Tabs.Tab value="login">Sign in</Tabs.Tab>
            <Tabs.Tab value="register">Sign up</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login" pt="md">
            <form
              onSubmit={loginForm.onSubmit((values) => {
                login.mutate(values);
              })}
            >
              <Stack>
                <TextInput label="Email" placeholder="you@example.com" {...loginForm.getInputProps('email')} />
                <PasswordInput label="Password" placeholder="••••••••" {...loginForm.getInputProps('password')} />
                <Button type="submit" loading={login.isPending}>
                  Sign in
                </Button>
                <Text size="xs" c="dimmed">
                  Need an account? Switch to{' '}
                  <Anchor component="button" onClick={() => setTab('register')}>
                    Sign up
                  </Anchor>
                </Text>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="register" pt="md">
            <form
              onSubmit={registerForm.onSubmit((values) => {
                register.mutate(values);
              })}
            >
              <Stack>
                <TextInput label="Full name" placeholder="Grace Hopper" {...registerForm.getInputProps('name')} />
                <TextInput label="Email" placeholder="you@example.com" {...registerForm.getInputProps('email')} />
                <PasswordInput label="Password" placeholder="At least 8 characters" {...registerForm.getInputProps('password')} />
                <Button type="submit" loading={register.isPending}>
                  Create account
                </Button>
                <Text size="xs" c="dimmed">
                  Already have an account?{' '}
                  <Anchor component="button" onClick={() => setTab('login')}>
                    Sign in
                  </Anchor>
                </Text>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
        <Divider my="lg" label="Demo credentials" labelPosition="center" />
        <Group justify="space-between">
          <Stack gap={0}>
            <Text fw={600}>demo@example.com</Text>
            <Text size="sm" c="dimmed">
              Password: demo1234
            </Text>
          </Stack>
          <Button
            variant="light"
            onClick={() => {
              loginForm.setValues({ email: 'demo@example.com', password: 'demo1234' });
            }}
          >
            Fill form
          </Button>
        </Group>
      </Paper>
    </Center>
  );
};
