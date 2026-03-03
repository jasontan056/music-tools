import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import App from './App';
import { theme } from './theme';

vi.mock('./providers/AuthProvider', () => ({
  useAuth: () => ({
    token: null,
    setToken: vi.fn()
  })
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn()
  }
}));

vi.mock('./lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ invalidate: vi.fn() }),
    auth: {
      me: {
        useQuery: () => ({
          data: null,
          isLoading: false
        })
      },
      logout: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false
        })
      }
    }
  }
}));

describe('App', () => {
  it('renders the Triad Explorer by default without login', () => {
    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>
    );

    expect(screen.getByText('Triad Explorer')).toBeTruthy();
  });
});
