import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { ActionIcon, Badge, Button, Card, Group, Paper, Progress, SegmentedControl, SimpleGrid, Skeleton, Stack, Text, Textarea, TextInput, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { IconMoodSmile, IconSearch, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { TodoPriority, TodoStatus, TODO_PRIORITY_COLORS, TODO_PRIORITY_LABELS, TODO_STATUS_LABELS, formatDate, formatRelativeDate } from '@acme/common';
import { trpc } from '../lib/trpc';
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
const initialFilters = {
    status: 'ALL',
    priority: 'ALL',
    search: ''
};
export const TodoList = ({ user }) => {
    const utils = trpc.useUtils();
    const isMobile = useMediaQuery('(max-width: 48em)');
    const [filters, setFilters] = useState(initialFilters);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(TodoPriority.MEDIUM);
    const [dueAt, setDueAt] = useState(null);
    const listInput = useMemo(() => {
        return {
            status: filters.status === 'ALL' ? undefined : filters.status,
            priority: filters.priority === 'ALL' ? undefined : filters.priority,
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
    const completionRate = stats.total === 0 ? 0 : Math.round((stats.byStatus[TodoStatus.DONE] / stats.total) * 100);
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
    return (_jsxs(Stack, { gap: "lg", children: [_jsxs(Stack, { gap: "sm", children: [_jsxs(Group, { justify: "space-between", align: "baseline", children: [_jsxs("div", { children: [_jsx(Title, { order: 4, children: "Your week at a glance" }), _jsxs(Text, { size: "sm", c: "dimmed", children: [stats.total, " tasks tracked for ", user.name ?? 'you'] })] }), _jsxs(Badge, { variant: "light", color: "ocean", children: [completionRate, "% complete"] })] }), _jsxs(SimpleGrid, { cols: { base: 1, sm: 2, lg: 4 }, children: [statusSelectData.map((option) => (_jsxs(Paper, { withBorder: true, radius: "lg", p: "md", children: [_jsx(Text, { size: "xs", c: "dimmed", children: option.label }), _jsx(Text, { fz: 32, fw: 700, children: stats.byStatus[option.value] ?? 0 })] }, option.value))), _jsxs(Paper, { withBorder: true, radius: "lg", p: "md", children: [_jsx(Text, { size: "xs", c: "dimmed", children: "Completion" }), _jsxs(Text, { fw: 600, mb: "xs", children: [completionRate, "%"] }), _jsx(Progress, { value: completionRate, color: "ocean", transitionDuration: 300 })] })] })] }), _jsx(Card, { radius: "xl", withBorder: false, shadow: "xl", p: "xl", style: { background: 'linear-gradient(135deg,#0b7285,#1864ab)', color: 'white' }, children: _jsxs(Stack, { gap: "sm", children: [_jsx(Title, { order: 4, c: "white", children: "Capture a new task" }), _jsx(TextInput, { label: "Title", placeholder: "Write Cypress tests", value: title, onChange: (event) => setTitle(event.currentTarget.value) }), _jsx(Textarea, { label: "Description", placeholder: "Add extra context for your team", value: description, autosize: true, minRows: 2, onChange: (event) => setDescription(event.currentTarget.value) }), _jsxs(Group, { gap: "md", wrap: "wrap", align: "flex-end", children: [_jsx(SegmentedControl, { value: priority, onChange: (value) => setPriority(value), data: [
                                        { label: TODO_PRIORITY_LABELS[TodoPriority.LOW], value: TodoPriority.LOW },
                                        { label: TODO_PRIORITY_LABELS[TodoPriority.MEDIUM], value: TodoPriority.MEDIUM },
                                        { label: TODO_PRIORITY_LABELS[TodoPriority.HIGH], value: TodoPriority.HIGH }
                                    ], fullWidth: isMobile }), _jsx(DateInput, { valueFormat: "MMM D, YYYY", label: "Due date", value: dueAt, onChange: setDueAt, placeholder: "Optional", clearable: true, maw: 320 })] }), _jsx(Group, { justify: "flex-end", children: _jsx(Button, { color: "white", variant: "light", onClick: handleSubmit, loading: createTodo.isPending, disabled: !title.trim(), children: "Add todo" }) })] }) }), _jsx(Paper, { withBorder: true, radius: "lg", p: "lg", children: _jsx(Stack, { gap: "sm", children: _jsxs(Group, { gap: "sm", align: "flex-start", wrap: "wrap", children: [_jsx(SegmentedControl, { value: filters.status, onChange: (value) => setFilters((prev) => ({ ...prev, status: value })), data: statusFilters, fullWidth: isMobile }), _jsx(SegmentedControl, { value: filters.priority, onChange: (value) => setFilters((prev) => ({ ...prev, priority: value })), data: priorityFilters, fullWidth: isMobile }), _jsx(TextInput, { placeholder: "Search by title or description", value: filters.search, leftSection: _jsx(IconSearch, { size: 16 }), onChange: (event) => setFilters((prev) => ({ ...prev, search: event.currentTarget.value })), w: isMobile ? '100%' : 250 })] }) }) }), todosQuery.isLoading && _jsx(Skeleton, { height: 140, radius: "lg" }), todos.length === 0 && !todosQuery.isLoading ? (_jsx(Paper, { withBorder: true, radius: "lg", p: "xl", ta: "center", children: _jsxs(Stack, { align: "center", gap: "xs", children: [_jsx(ThemeIcon, { size: 48, radius: "xl", color: "ocean", variant: "light", children: _jsx(IconMoodSmile, { size: 24 }) }), _jsx(Text, { fw: 600, children: "No todos match these filters" }), _jsx(Text, { c: "dimmed", size: "sm", children: "Try adjusting the filters or create a new task above." })] }) })) : (todos.map((todo) => (_jsx(Paper, { radius: "lg", withBorder: true, p: "lg", children: _jsx(Stack, { gap: "xs", children: _jsxs(Group, { gap: "xs", justify: "space-between", align: "flex-start", children: [_jsxs(Stack, { gap: 4, style: { flex: 1 }, children: [_jsxs(Group, { gap: "xs", wrap: "wrap", children: [_jsx(Badge, { color: TODO_PRIORITY_COLORS[todo.priority], children: TODO_PRIORITY_LABELS[todo.priority] }), _jsx(Text, { fw: 600, children: todo.title })] }), todo.description && (_jsx(Text, { size: "sm", c: "dimmed", children: todo.description })), _jsxs(Group, { gap: "xs", wrap: "wrap", children: [_jsx(Badge, { variant: "light", children: TODO_STATUS_LABELS[todo.status] }), _jsxs(Text, { size: "xs", c: "dimmed", children: ["Due ", formatRelativeDate(todo.dueAt)] }), _jsxs(Text, { size: "xs", c: "dimmed", children: ["Created ", formatDate(todo.createdAt)] })] })] }), _jsxs(Group, { gap: "xs", wrap: "nowrap", children: [_jsx(SegmentedControl, { value: todo.status, data: statusSelectData, size: "xs", "aria-label": `Update status for ${todo.title}`, onChange: (value) => updateStatus.mutate({ id: todo.id, status: value }) }), _jsx(Tooltip, { label: "Delete task", children: _jsx(ActionIcon, { color: "red", variant: "light", onClick: () => deleteTodo.mutate({ id: todo.id }), loading: deleteTodo.isPending, children: _jsx(IconTrash, { size: 16 }) }) })] })] }) }) }, todo.id))))] }));
};
