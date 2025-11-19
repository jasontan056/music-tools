import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';
import type { UserProfile } from '@acme/common';
import { theme } from '../theme';

process.env.TZ = 'UTC';

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

const invalidate = vi.fn();
const createMutate = vi.fn();
const updateStatusMutate = vi.fn();
const deleteMutate = vi.fn();

const mutationResult = (handler: typeof createMutate) => ({
  mutate: handler,
  isPending: false
});

vi.mock('../lib/trpc', () => {
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
        create: { useMutation: () => mutationResult(createMutate) },
        updateStatus: { useMutation: () => mutationResult(updateStatusMutate) },
        delete: { useMutation: () => mutationResult(deleteMutate) }
      }
    }
  };
});

const renderList = () =>
  render(
    <MantineProvider theme={theme}>
      <TodoList user={sampleUser} />
    </MantineProvider>
  );

beforeEach(() => {
  createMutate.mockReset();
  updateStatusMutate.mockReset();
  deleteMutate.mockReset();
});

describe('TodoList', () => {
  it('renders stats and todo cards', () => {
    renderList();

    expect(screen.getByText(/Your week at a glance/i)).toBeInTheDocument();
    expect(screen.getByText(/Ship UI refresh/)).toBeInTheDocument();
    expect(screen.getByText(/3 tasks tracked/i)).toBeInTheDocument();
  });

  it('submits the selected due date alongside the form', async () => {
    const user = userEvent.setup();
    renderList();

    await act(async () => {
      await user.type(screen.getByLabelText(/title/i), 'Write Vitest coverage');
      const dueInput = screen.getByLabelText(/due date/i);
      await user.type(dueInput, 'Jul 20, 2035');
      await user.tab();
      await user.click(screen.getByRole('button', { name: /add todo/i }));
    });

    expect(createMutate).toHaveBeenCalled();
    const payload = createMutate.mock.calls.at(-1)?.[0];
    expect(payload?.title).toBe('Write Vitest coverage');
    expect(payload?.dueAt).toBeInstanceOf(Date);
    expect((payload?.dueAt as Date).toISOString()).toContain('2035-07-20');
  });

  it('allows updating todo status inline', async () => {
    const user = userEvent.setup();
    renderList();

    const control = screen.getByLabelText(/update status for ship ui refresh/i);
    const doneRadio = within(control).getByRole('radio', { name: /done/i });
    await act(async () => {
      await user.click(doneRadio);
    });

    expect(updateStatusMutate).toHaveBeenCalledWith({ id: 'todo-1', status: 'DONE' });
  });
});
