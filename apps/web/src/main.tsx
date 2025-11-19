import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import App from './App';
import { trpc } from './lib/trpc';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: '/trpc',
      fetch(url, options) {
        return fetch(url, {
          ...options,
          headers: {
            ...options?.headers,
            'x-user-id': 'demo-user'
          }
        });
      }
    })
  ]
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MantineProvider defaultColorScheme="dark">
          <Notifications />
          <App />
        </MantineProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>
);
