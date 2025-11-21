import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ActionIcon, AppShell, Avatar, Badge, Center, Container, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
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
        return _jsx(AuthPanel, {});
    }
    if (meQuery.isLoading) {
        return (_jsx(Center, { h: "100vh", children: _jsx(Loader, {}) }));
    }
    if (meQuery.error || !meQuery.data) {
        return _jsx(AuthPanel, {});
    }
    const user = meQuery.data;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return (_jsxs(AppShell, { header: { height: 72 }, padding: "0", bg: "var(--mantine-color-gray-0)", withBorder: false, styles: {
            header: {
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255,255,255,0.9)'
            }
        }, children: [_jsx(AppShell.Header, { children: _jsx(Container, { size: "lg", h: "100%", children: _jsxs(Group, { h: "100%", justify: "space-between", children: [_jsxs(Stack, { gap: 2, children: [_jsxs(Text, { size: "sm", c: "dimmed", children: [greeting, ", ", user.name ?? 'there', " \uD83D\uDC4B"] }), _jsx(Title, { order: 3, children: APP_TITLE })] }), _jsxs(Group, { gap: "xs", wrap: "nowrap", children: [_jsx(Avatar, { radius: "xl", color: "ocean", children: user.name?.[0] ?? user.email[0] }), _jsxs(Stack, { gap: 0, visibleFrom: "sm", children: [_jsx(Text, { fw: 600, children: user.name ?? 'New teammate' }), _jsxs(Group, { gap: 4, children: [_jsx(Text, { size: "xs", c: "dimmed", children: user.email }), _jsx(Badge, { size: "xs", variant: "light", color: "midnight", children: user.role.toLowerCase() })] })] }), _jsx(ActionIcon, { variant: "light", color: "red", "aria-label": "Sign out", onClick: () => logout.mutate(), loading: logout.isPending, children: _jsx(IconLogout, { size: 18 }) })] })] }) }) }), _jsx(AppShell.Main, { style: { background: 'radial-gradient(circle at top, #eff6ff 0%, #fdfdfd 60%)' }, children: _jsx(Container, { size: "lg", py: "xl", children: _jsxs(Stack, { gap: "xl", children: [_jsx(Paper, { p: "xl", radius: "xl", style: {
                                    background: 'linear-gradient(120deg, #1c7ed6, #7048e8)',
                                    color: 'white'
                                }, children: _jsxs(Stack, { gap: "xs", children: [_jsx(Text, { size: "sm", fw: 500, c: "rgba(255,255,255,0.8)", children: "Plan, prioritize, and ship todos faster" }), _jsx(Title, { order: 2, c: "white", children: "Your personal productivity cockpit" }), _jsx(Text, { size: "sm", c: "rgba(255,255,255,0.8)", children: "Track work-in-progress, capture new tasks, and keep priorities aligned across devices." })] }) }), _jsx(TodoList, { user: user })] }) }) })] }));
};
export default App;
