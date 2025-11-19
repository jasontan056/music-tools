import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { TodoPriority, TodoStatus, TODO_PRIORITY_COLORS, TODO_PRIORITY_LABELS, TODO_STATUS_LABELS, formatDate, formatRelativeDate, type UserProfile } from '@acme/common';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@acme/api';
import { trpc } from '../lib/trpc';

type TodoListItem = inferRouterOutputs<AppRouter>['todo']['list'][number];

const statusFilters = [
  { label: 'All', value: 'ALL' },
  { label: TODO_STATUS_LABELS[TodoStatus.BACKLOG], value: TodoStatus.BACKLOG },
  { label: TODO_STATUS_LABELS[TodoStatus.IN_PROGRESS], value: TodoStatus.IN_PROGRESS },
  { label: TODO_STATUS_LABELS[TodoStatus.DONE], value: TodoStatus.DONE }
];

const priorityFilters = [
  { label: 'All priorities', value: 'ALL' },
  { label: TODO_PRIORITY_LABELS[TodoPriority.HIGH], value: TodoPriority.HIGH },
  { label: TODO_PRIORITY_LABELS[TodoPriority.MEDIUM], value: TodoPriority.MEDIUM },
  { label: TODO_PRIORITY_LABELS[TodoPriority.LOW], value: TodoPriority.LOW }
];

const statusSelectData = statusFilters.filter((option) => option.value !== 'ALL');

type Filters = {
  status: (typeof statusFilters)[number]['value'];
  priority: (typeof priorityFilters)[number]['value'];
  search: string;
};

const initialFilters: Filters = {
  status: 'ALL',
  priority: 'ALL',
  search: ''
};

export const TodoList = ({ user }: { user: UserProfile }) => {
  const utils = trpc.useUtils();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>(TodoPriority.MEDIUM);
  const [dueAt, setDueAt] = useState<Date | null>(null);

  const listInput = useMemo(() => {
    return {
      status: filters.status === 'ALL' ? undefined : (filters.status as TodoStatus),
      priority: filters.priority === 'ALL' ? undefined : (filters.priority as TodoPriority),
      search: filters.search || undefined
    };
  }, [filters]);

  const todosQuery = trpc.todo.list.useQuery(listInput);
  const statsQuery = trpc.todo.stats.useQuery(undefined, { staleTime: 1000 * 30 });

  const createTodo = trpc.todo.create.useMutation({
    onSuccess: async () => {
      setTitle('');
      setDescription('');
      setPriority(TodoPriority.MEDIUM);
      setDueAt(null);
      await utils.todo.list.invalidate();
      await utils.todo.stats.invalidate();
      notifications.show({ title: 'Todo created', message: `Nice work, ${user.name ?? 'friend'}!` });
    },
    onError: (error) => {
      notifications.show({ title: 'Unable to create todo', message: error.message, color: 'red' });
    }
  });

  const updateStatus = trpc.todo.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.todo.list.invalidate();
      await utils.todo.stats.invalidate();
    }
  });

  const deleteTodo = trpc.todo.delete.useMutation({
    onSuccess: async () => {
      await utils.todo.list.invalidate();
      await utils.todo.stats.invalidate();
      notifications.show({ title: 'Todo removed', message: 'One less thing to worry about' });
    }
  });

  const todos = todosQuery.data ?? [];
  const stats = statsQuery.data ?? {
    total: 0,
    byStatus: {
      [TodoStatus.BACKLOG]: 0,
      [TodoStatus.IN_PROGRESS]: 0,
      [TodoStatus.DONE]: 0
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }

    createTodo.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueAt: dueAt ?? undefined
    });
  };

  return (
    <Stack gap="lg">
      <Paper radius="lg" withBorder p="md">
        <Group justify="space-between" mb="sm">
          <Title order={4}>Progress</Title>
          <Text size="sm" c="dimmed">
            {stats.total} tasks
          </Text>
        </Group>
        <Group>
          {statusSelectData.map((option) => (
            <Stack key={option.value} gap={0} align="center">
              <Text fw={600} size="lg">
                {stats.byStatus[option.value as TodoStatus] ?? 0}
              </Text>
              <Text size="xs" c="dimmed">
                {option.label}
              </Text>
            </Stack>
          ))}
        </Group>
      </Paper>

      <Card withBorder radius="lg" shadow="xs">
        <Stack>
          <Title order={5}>Create a task</Title>
          <TextInput
            label="Title"
            placeholder="Write Cypress tests"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <Textarea
            label="Description"
            placeholder="Add extra context for your team"
            value={description}
            autosize
            minRows={2}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
          <Group grow>
            <SegmentedControl
              value={priority}
              onChange={(value) => setPriority(value as TodoPriority)}
              data={[
                { label: TODO_PRIORITY_LABELS[TodoPriority.LOW], value: TodoPriority.LOW },
                { label: TODO_PRIORITY_LABELS[TodoPriority.MEDIUM], value: TodoPriority.MEDIUM },
                { label: TODO_PRIORITY_LABELS[TodoPriority.HIGH], value: TodoPriority.HIGH }
              ]}
            />
            <DateInput
              valueFormat="MMM D, YYYY"
              label="Due date"
              value={dueAt}
              onChange={setDueAt}
              placeholder="Optional"
              clearable
            />
          </Group>
          <Group justify="flex-end">
            <Button onClick={handleSubmit} loading={createTodo.isPending} disabled={!title.trim()}>
              Add todo
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="lg">
        <Stack gap="sm">
          <Group>
            <SegmentedControl
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value as Filters['status'] }))}
              data={statusFilters}
            />
          </Group>
          <Group>
            <SegmentedControl
              value={filters.priority}
              onChange={(value) => setFilters((prev) => ({ ...prev, priority: value as Filters['priority'] }))}
              data={priorityFilters}
            />
          </Group>
          <TextInput
            placeholder="Search by title or description"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.currentTarget.value }))}
          />
        </Stack>
      </Card>

      {todosQuery.isLoading && <Skeleton height={140} radius="lg" />}

      {todos.length === 0 && !todosQuery.isLoading ? (
        <Paper withBorder radius="lg" p="xl" ta="center">
          <Text fw={600}>No todos match these filters</Text>
          <Text c="dimmed" size="sm">
            Try adjusting the filters or create a new task above.
          </Text>
        </Paper>
      ) : (
        todos.map((todo) => (
          <Card key={todo.id} withBorder radius="lg">
            <Group justify="space-between" align="flex-start">
              <Stack gap={4}>
                <Group gap="xs">
                  <Badge color={TODO_PRIORITY_COLORS[todo.priority]}>{TODO_PRIORITY_LABELS[todo.priority]}</Badge>
                  <Text fw={600}>{todo.title}</Text>
                </Group>
                {todo.description && (
                  <Text size="sm" c="dimmed">
                    {todo.description}
                  </Text>
                )}
                <Group gap="xs">
                  <Badge variant="light">{TODO_STATUS_LABELS[todo.status]}</Badge>
                  <Text size="xs" c="dimmed">
                    Due {formatRelativeDate(todo.dueAt)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Created {formatDate(todo.createdAt)}
                  </Text>
                </Group>
              </Stack>
              <Group gap="xs">
                <SegmentedControl
                  value={todo.status}
                  data={statusSelectData}
                  size="xs"
                  onChange={(value) => updateStatus.mutate({ id: todo.id, status: value as TodoStatus })}
                />
                <Tooltip label="Delete task">
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => deleteTodo.mutate({ id: todo.id })}
                    loading={deleteTodo.isPending}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Card>
        ))
      )}
    </Stack>
  );
};
