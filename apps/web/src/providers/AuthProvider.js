import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { AUTH_TOKEN_KEY } from '@acme/common';
import { trpc } from '../lib/trpc';
const AuthContext = createContext(undefined);
const createClient = (token) => trpc.createClient({
    links: [
        httpBatchLink({
            url: '/trpc',
            transformer: superjson,
            headers() {
                return token ? { Authorization: `Bearer ${token}` } : {};
            }
        })
    ]
});
export const AuthProvider = ({ children }) => {
    const [token, setTokenState] = useState(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        return localStorage.getItem(AUTH_TOKEN_KEY);
    });
    const queryClientRef = useRef(new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 1
            }
        }
    }));
    const client = useMemo(() => createClient(token), [token]);
    const setToken = (value) => {
        setTokenState(value);
        if (value) {
            localStorage.setItem(AUTH_TOKEN_KEY, value);
        }
        else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        queryClientRef.current.clear();
    };
    return (_jsx(AuthContext.Provider, { value: { token, setToken }, children: _jsx(trpc.Provider, { client: client, queryClient: queryClientRef.current, children: _jsx(QueryClientProvider, { client: queryClientRef.current, children: children }) }) }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
