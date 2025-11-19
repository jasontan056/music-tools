import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { AUTH_TOKEN_KEY } from '@acme/common';
import { trpc } from '../lib/trpc';

type AuthContextValue = {
  token: string | null;
  setToken: (value: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const createClient = (token: string | null) =>
  trpc.createClient({
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(AUTH_TOKEN_KEY);
  });
  const queryClientRef = useRef(
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1
        }
      }
    })
  );

  const client = useMemo(() => createClient(token), [token]);

  const setToken = (value: string | null) => {
    setTokenState(value);
    if (value) {
      localStorage.setItem(AUTH_TOKEN_KEY, value);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    queryClientRef.current.clear();
  };

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      <trpc.Provider client={client} queryClient={queryClientRef.current}>
        <QueryClientProvider client={queryClientRef.current}>{children}</QueryClientProvider>
      </trpc.Provider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
