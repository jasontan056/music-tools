import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { TodoList } from './TodoList';
import type { UserProfile } from '@acme/common';
import { theme } from '../theme';

const sampleUser: UserProfile = {
  id: 'user-1',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'USER',
  createdAt: new Date().toISOString()
};

const sampleTodos = [
  {
    id: 'todo-1',
    title: 'Ship UI refresh',
    description: 'Polish gradients and spacing',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    ownerId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueAt: new Date().toISOString(),
    owner: { id: 'user-1', name: 'Demo', email: 'demo@example.com' }
  }
] as any;

const sampleStats = {
  total: 3,
  byStatus: {
    BACKLOG: 1,
    IN_PROGRESS: 1,
    DONE: 1
  }
};

vi.mock('../lib/trpc', () => {
  const invalidate = vi.fn();
  const mutation = { mutate: vi.fn(), isPending: false };

  return {
    trpc: {
      useUtils: () => ({
        todo: {
          list: { invalidate },
          stats: { invalidate }
        }
      }),
      todo: {
        list: { useQuery: () => ({ data: sampleTodos, isLoading: false }) },
        stats: { useQuery: () => ({ data: sampleStats, isLoading: false }) },
        create: { useMutation: () => mutation },
        updateStatus: { useMutation: () => mutation },
        delete: { useMutation: () => mutation }
      }
    }
  };
});

describe('TodoList', () => {
  it('renders stats and todo cards', () => {
    render(
      <MantineProvider theme={theme}>
        <TodoList user={sampleUser} />
      </MantineProvider>
    );

    expect(screen.getByText(/Your week at a glance/i)).toBeInTheDocument();
    expect(screen.getByText(/Ship UI refresh/)).toBeInTheDocument();
    expect(screen.getByText(/3 tasks tracked/i)).toBeInTheDocument();
  });
});
