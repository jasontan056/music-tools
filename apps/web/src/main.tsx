import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@fontsource-variable/inter';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';
import { theme } from './theme';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <MantineProvider defaultColorScheme="light" theme={theme}>
        <Notifications position="top-right" zIndex={9999} />
        <App />
      </MantineProvider>
    </AuthProvider>
  </StrictMode>
);
