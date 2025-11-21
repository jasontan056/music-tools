import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Anchor, Button, Container, Divider, Group, List, Paper, PasswordInput, SimpleGrid, Stack, Tabs, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { APP_TITLE } from '@acme/common';
import { trpc } from '../lib/trpc';
import { useAuth } from '../providers/AuthProvider';
export const AuthPanel = () => {
    const [tab, setTab] = useState('login');
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
    return (_jsx(Stack, { mih: "100vh", justify: "center", style: {
            background: 'linear-gradient(120deg, #e6f2ff, #f8f1ff)'
        }, px: "md", py: "xl", children: _jsx(Container, { size: "lg", children: _jsxs(SimpleGrid, { cols: { base: 1, md: 2 }, spacing: "xl", children: [_jsxs(Stack, { gap: "md", justify: "center", children: [_jsxs(Stack, { gap: 4, children: [_jsxs(Text, { size: "sm", fw: 500, c: "dimmed", children: ["Say hello to ", APP_TITLE] }), _jsx(Title, { order: 1, fz: { base: 30, sm: 44 }, children: "Your tasks, beautifully organized" }), _jsx(Text, { size: "lg", c: "dimmed", children: "Focus on deep work with a responsive UI built for clarity. Capture, prioritize, and finish todos with confidence on desktop and mobile alike." })] }), _jsxs(List, { spacing: "xs", size: "sm", icon: _jsx(ThemeIcon, { color: "ocean", variant: "light", size: 22, radius: "xl", children: _jsx(IconCheck, { size: 14 }) }), children: [_jsx(List.Item, { children: "Credential-based auth with secure sessions" }), _jsx(List.Item, { children: "Priority-aware todo board with due dates" }), _jsx(List.Item, { children: "Responsive layout that shines on any device" })] })] }), _jsxs(Paper, { withBorder: true, shadow: "xl", p: "xl", radius: "xl", bg: "white", children: [_jsxs(Stack, { gap: "xs", mb: "lg", ta: "center", children: [_jsx(Title, { order: 3, children: APP_TITLE }), _jsx(Text, { c: "dimmed", children: "Sign in or create an account to manage your todos" })] }), _jsxs(Tabs, { value: tab, onChange: (value) => setTab(value ?? 'login'), variant: "outline", children: [_jsxs(Tabs.List, { grow: true, children: [_jsx(Tabs.Tab, { value: "login", children: "Sign in" }), _jsx(Tabs.Tab, { value: "register", children: "Sign up" })] }), _jsx(Tabs.Panel, { value: "login", pt: "md", children: _jsx("form", { onSubmit: loginForm.onSubmit((values) => {
                                                login.mutate(values);
                                            }), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "Email", placeholder: "you@example.com", ...loginForm.getInputProps('email') }), _jsx(PasswordInput, { label: "Password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...loginForm.getInputProps('password') }), _jsx(Button, { type: "submit", loading: login.isPending, children: "Sign in" }), _jsxs(Text, { size: "xs", c: "dimmed", children: ["Need an account? Switch to", ' ', _jsx(Anchor, { component: "button", onClick: () => setTab('register'), children: "Sign up" })] })] }) }) }), _jsx(Tabs.Panel, { value: "register", pt: "md", children: _jsx("form", { onSubmit: registerForm.onSubmit((values) => {
                                                register.mutate(values);
                                            }), children: _jsxs(Stack, { children: [_jsx(TextInput, { label: "Full name", placeholder: "Grace Hopper", ...registerForm.getInputProps('name') }), _jsx(TextInput, { label: "Email", placeholder: "you@example.com", ...registerForm.getInputProps('email') }), _jsx(PasswordInput, { label: "Password", placeholder: "At least 8 characters", ...registerForm.getInputProps('password') }), _jsx(Button, { type: "submit", loading: register.isPending, children: "Create account" }), _jsxs(Text, { size: "xs", c: "dimmed", children: ["Already have an account?", ' ', _jsx(Anchor, { component: "button", onClick: () => setTab('login'), children: "Sign in" })] })] }) }) })] }), _jsx(Divider, { my: "lg", label: "Demo credentials", labelPosition: "center" }), _jsxs(Group, { justify: "space-between", align: "center", children: [_jsxs(Stack, { gap: 0, children: [_jsx(Text, { fw: 600, children: "demo@example.com" }), _jsx(Text, { size: "sm", c: "dimmed", children: "Password: demo1234" })] }), _jsx(Button, { variant: "light", onClick: () => {
                                            loginForm.setValues({ email: 'demo@example.com', password: 'demo1234' });
                                        }, children: "Fill form" })] })] })] }) }) }));
};
