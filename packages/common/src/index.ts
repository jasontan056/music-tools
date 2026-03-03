export type UserRole = 'ADMIN' | 'USER';

export const APP_TITLE = 'Fretboard Tools';
export const AUTH_TOKEN_KEY = 'fretboard-tools.session';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const isServer = () => typeof window === 'undefined';

export const formatDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('en-US', { hour12: false });
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
