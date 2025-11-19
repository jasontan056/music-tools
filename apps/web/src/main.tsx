import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <MantineProvider defaultColorScheme="dark">
        <Notifications />
        <App />
      </MantineProvider>
    </AuthProvider>
  </StrictMode>
);
