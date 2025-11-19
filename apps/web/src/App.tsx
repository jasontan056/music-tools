import { AppShell, Container, Group, Text, Title } from '@mantine/core';
import { APP_TITLE } from '@acme/common';
import { TodoList } from './components/TodoList';

const App = () => {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3}>{APP_TITLE}</Title>
          <Text size="sm" c="dimmed">
            Monorepo playground
          </Text>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="sm">
          <TodoList />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default App;
