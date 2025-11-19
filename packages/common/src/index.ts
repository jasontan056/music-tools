export type UserRole = 'ADMIN' | 'USER';

export const APP_TITLE = 'Skeleton Todos';
export const AUTH_TOKEN_KEY = 'skeleton3.session';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const isServer = () => typeof window === 'undefined';

export const formatDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('en-US', { hour12: false });
};

export const formatRelativeDate = (value?: Date | string | null) => {
  if (!value) {
    return 'No due date';
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export enum TodoStatus {
  BACKLOG = 'BACKLOG',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export enum TodoPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export const TODO_STATUS_LABELS: Record<TodoStatus, string> = {
  [TodoStatus.BACKLOG]: 'Backlog',
  [TodoStatus.IN_PROGRESS]: 'In progress',
  [TodoStatus.DONE]: 'Done'
};

export const TODO_PRIORITY_LABELS: Record<TodoPriority, string> = {
  [TodoPriority.LOW]: 'Low',
  [TodoPriority.MEDIUM]: 'Medium',
  [TodoPriority.HIGH]: 'High'
};

export const TODO_PRIORITY_COLORS: Record<TodoPriority, string> = {
  [TodoPriority.LOW]: 'teal',
  [TodoPriority.MEDIUM]: 'orange',
  [TodoPriority.HIGH]: 'red'
};

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
};

export type AuthPayload = {
  token: string;
  user: UserProfile;
};
