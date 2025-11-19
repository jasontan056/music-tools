import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { AuthPanel } from './AuthPanel';
import { theme } from '../theme';

const loginMutate = vi.fn();
const registerMutate = vi.fn();
const invalidate = vi.fn();
const setToken = vi.fn();

vi.mock('../lib/trpc', () => ({
  trpc: {
    useUtils: () => ({ invalidate }),
    auth: {
      login: { useMutation: () => ({ mutate: loginMutate, isPending: false }) },
      register: { useMutation: () => ({ mutate: registerMutate, isPending: false }) }
    }
  }
}));

vi.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({
    token: null,
    setToken
  })
}));

const renderPanel = () =>
  render(
    <MantineProvider theme={theme}>
      <AuthPanel />
    </MantineProvider>
  );

describe('AuthPanel', () => {
  it('submits login form with provided credentials', async () => {
    const user = userEvent.setup();
    renderPanel();

    const [loginEmailInput] = screen.getAllByLabelText(/email/i);
    const loginPasswordInput = screen.getAllByLabelText(/password/i)[0];
    await act(async () => {
      await user.type(loginEmailInput, 'user@example.com');
      await user.type(loginPasswordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(loginMutate).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
  });

  it('allows switching to registration tab', async () => {
    const user = userEvent.setup();
    renderPanel();

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: /sign up/i }));
    });
    const fullNameInput = await screen.findByLabelText(/full name/i);
    const registerEmailInput = screen.getAllByLabelText(/email/i).pop() as HTMLElement;
    const registerPasswordInput = screen.getByPlaceholderText(/at least 8 characters/i);
    await act(async () => {
      await user.type(fullNameInput, 'Grace');
      await user.type(registerEmailInput, 'new@example.com');
      await user.type(registerPasswordInput, 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));
    });

    expect(registerMutate).toHaveBeenCalledWith({
      name: 'Grace',
      email: 'new@example.com',
      password: 'password123'
    });
  });
});
