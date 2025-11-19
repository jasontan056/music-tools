import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { IconMoodSmile, IconSearch, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  TodoPriority,
  TodoStatus,
  TODO_PRIORITY_COLORS,
  TODO_PRIORITY_LABELS,
  TODO_STATUS_LABELS,
  formatDate,
  formatRelativeDate,
  type UserProfile
} from '@acme/common';
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
  const isMobile = useMediaQuery('(max-width: 48em)');
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
  const completionRate =
    stats.total === 0 ? 0 : Math.round((stats.byStatus[TodoStatus.DONE] / stats.total) * 100);

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
      <Stack gap="sm">
        <Group justify="space-between" align="baseline">
          <div>
            <Title order={4}>Your week at a glance</Title>
            <Text size="sm" c="dimmed">
              {stats.total} tasks tracked for {user.name ?? 'you'}
            </Text>
          </div>
          <Badge variant="light" color="ocean">
            {completionRate}% complete
          </Badge>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {statusSelectData.map((option) => (
            <Paper key={option.value} withBorder radius="lg" p="md">
              <Text size="xs" c="dimmed">
                {option.label}
              </Text>
              <Text fz={32} fw={700}>
                {stats.byStatus[option.value as TodoStatus] ?? 0}
              </Text>
            </Paper>
          ))}
          <Paper withBorder radius="lg" p="md">
            <Text size="xs" c="dimmed">
              Completion
            </Text>
            <Text fw={600} mb="xs">
              {completionRate}%
            </Text>
            <Progress value={completionRate} color="ocean" transitionDuration={300} />
          </Paper>
        </SimpleGrid>
      </Stack>

      <Card radius="xl" withBorder={false} shadow="xl" p="xl" style={{ background: 'linear-gradient(135deg,#0b7285,#1864ab)', color: 'white' }}>
        <Stack gap="sm">
          <Title order={4} c="white">
            Capture a new task
          </Title>
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
          <Group gap="md" wrap="wrap" align="flex-end">
            <SegmentedControl
              value={priority}
              onChange={(value) => setPriority(value as TodoPriority)}
              data={[
                { label: TODO_PRIORITY_LABELS[TodoPriority.LOW], value: TodoPriority.LOW },
                { label: TODO_PRIORITY_LABELS[TodoPriority.MEDIUM], value: TodoPriority.MEDIUM },
                { label: TODO_PRIORITY_LABELS[TodoPriority.HIGH], value: TodoPriority.HIGH }
              ]}
              fullWidth={isMobile}
            />
            <DateInput
              valueFormat="MMM D, YYYY"
              label="Due date"
              value={dueAt}
              onChange={setDueAt}
              placeholder="Optional"
              clearable
              maw={320}
            />
          </Group>
          <Group justify="flex-end">
            <Button
              color="white"
              variant="light"
              onClick={handleSubmit}
              loading={createTodo.isPending}
              disabled={!title.trim()}
            >
              Add todo
            </Button>
          </Group>
        </Stack>
      </Card>

      <Paper withBorder radius="lg" p="lg">
        <Stack gap="sm">
          <Group gap="sm" align="flex-start" wrap="wrap">
            <SegmentedControl
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value as Filters['status'] }))}
              data={statusFilters}
              fullWidth={isMobile}
            />
            <SegmentedControl
              value={filters.priority}
              onChange={(value) => setFilters((prev) => ({ ...prev, priority: value as Filters['priority'] }))}
              data={priorityFilters}
              fullWidth={isMobile}
            />
            <TextInput
              placeholder="Search by title or description"
              value={filters.search}
              leftSection={<IconSearch size={16} />}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.currentTarget.value }))}
              w={isMobile ? '100%' : 250}
            />
          </Group>
        </Stack>
      </Paper>

      {todosQuery.isLoading && <Skeleton height={140} radius="lg" />}

      {todos.length === 0 && !todosQuery.isLoading ? (
        <Paper withBorder radius="lg" p="xl" ta="center">
          <Stack align="center" gap="xs">
            <ThemeIcon size={48} radius="xl" color="ocean" variant="light">
              <IconMoodSmile size={24} />
            </ThemeIcon>
            <Text fw={600}>No todos match these filters</Text>
            <Text c="dimmed" size="sm">
              Try adjusting the filters or create a new task above.
            </Text>
          </Stack>
        </Paper>
      ) : (
        todos.map((todo) => (
          <Paper key={todo.id} radius="lg" withBorder p="lg">
            <Stack gap="xs">
              <Group gap="xs" justify="space-between" align="flex-start">
                <Stack gap={4} style={{ flex: 1 }}>
                  <Group gap="xs" wrap="wrap">
                    <Badge color={TODO_PRIORITY_COLORS[todo.priority]}>{TODO_PRIORITY_LABELS[todo.priority]}</Badge>
                    <Text fw={600}>{todo.title}</Text>
                  </Group>
                  {todo.description && (
                    <Text size="sm" c="dimmed">
                      {todo.description}
                    </Text>
                  )}
                  <Group gap="xs" wrap="wrap">
                    <Badge variant="light">{TODO_STATUS_LABELS[todo.status]}</Badge>
                    <Text size="xs" c="dimmed">
                      Due {formatRelativeDate(todo.dueAt)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Created {formatDate(todo.createdAt)}
                    </Text>
                  </Group>
                </Stack>
                <Group gap="xs" wrap="nowrap">
                  <SegmentedControl
                    value={todo.status}
                    data={statusSelectData}
                    size="xs"
                    aria-label={`Update status for ${todo.title}`}
                    onChange={(value) => updateStatus.mutate({ id: todo.id, status: value as TodoStatus })}
                  />
                  <Tooltip label="Delete task">
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => deleteTodo.mutate({ id: todo.id })}
                      loading={deleteTodo.isPending}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
};
