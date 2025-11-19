export type UserRole = 'ADMIN' | 'USER';

export type Todo = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  ownerId: string;
};

export const APP_TITLE = 'Skeleton Todos';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isServer = () => typeof window === 'undefined';

export const formatDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('en-US', { hour12: false });
};
