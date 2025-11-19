import { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Group,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { trpc } from '../lib/trpc';
import { formatDate } from '@acme/common';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@acme/api';

type TodoListItem = inferRouterOutputs<AppRouter>['todo']['list'][number];

export const TodoList = () => {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const todosQuery = trpc.todo.list.useQuery(undefined, {
    staleTime: 1000 * 30
  });
  const todos: TodoListItem[] = todosQuery.data ?? [];

  const createTodo = trpc.todo.create.useMutation({
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      await utils.todo.list.invalidate();
      notifications.show({ title: 'Todo created', message: 'Nice work!' });
    }
  });

  const toggleTodo = trpc.todo.toggle.useMutation({
    onSuccess: async () => {
      await utils.todo.list.invalidate();
    }
  });

  const isButtonDisabled = !title || createTodo.isPending;

  const handleCreate = () => {
    createTodo.mutate({ title, description: description || undefined });
  };

  return (
    <Stack>
      <Card withBorder>
        <Stack>
          <TextInput
            label="New todo"
            placeholder="Add end-to-end tests"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <Textarea
            label="Description"
            placeholder="Optional"
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button onClick={handleCreate} loading={createTodo.isPending} disabled={isButtonDisabled}>
              Create
            </Button>
          </Group>
        </Stack>
      </Card>

      {todosQuery.isLoading && <Skeleton height={120} radius="lg" />}

      {todos.map((todo) => (
        <Card key={todo.id} withBorder>
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs">
              <Checkbox
                label={
                  <Text fw={600} td={todo.completed ? 'line-through' : undefined}>
                    {todo.title}
                  </Text>
                }
                checked={todo.completed}
                onChange={(event) =>
                  toggleTodo.mutate({ id: todo.id, completed: event.currentTarget.checked })
                }
              />
              {todo.description && (
                <Text size="sm" c="dimmed">
                  {todo.description}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Created {formatDate(todo.createdAt)} by {todo.owner.name ?? todo.owner.email}
              </Text>
            </Stack>
          </Group>
        </Card>
      ))}
    </Stack>
  );
};
