import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import type { UserProfile } from '@acme/common';
import App from './App';
import { theme } from './theme';

const sampleUser: UserProfile = {
  id: 'user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'USER',
  createdAt: new Date().toISOString()
};

const authSpies = vi.hoisted(() => ({
  setToken: vi.fn(),
  invalidate: vi.fn(),
  logoutMutate: vi.fn(),
  showNotification: vi.fn()
}));

vi.mock('./providers/AuthProvider', () => ({
  useAuth: () => ({
    token: 'test-token',
    setToken: authSpies.setToken
  })
}));

vi.mock('./components/TodoList', () => ({
  TodoList: () => <div data-testid="todo-list" />
}));

vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: authSpies.showNotification
  }
}));

vi.mock('./lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ invalidate: authSpies.invalidate }),
    auth: {
      me: {
        useQuery: () => ({
          data: sampleUser,
          isLoading: false
        })
      },
      logout: {
        useMutation: (options: { onSuccess?: () => Promise<void> | void }) => ({
          mutate: () => {
            authSpies.logoutMutate();
            return options?.onSuccess?.();
          },
          isPending: false
        })
      }
    }
  }
}));

describe('App', () => {
  it('runs the logout flow and clears auth state', async () => {
    const user = userEvent.setup();
    render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>
    );

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(authSpies.logoutMutate).toHaveBeenCalled();
    await waitFor(() => expect(authSpies.setToken).toHaveBeenCalledWith(null));
    expect(authSpies.invalidate).toHaveBeenCalled();
    expect(authSpies.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Signed out' }));
  });
});
