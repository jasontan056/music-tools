import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useState } from 'react';
import { TriadExplorer } from './components/triadExplorer';
import { AuthPanel } from './components/AuthPanel';
import { Home } from './components/Home';
import { useAuth } from './providers/AuthProvider';
import { trpc } from './lib/trpc';

const AppContent = () => {
  const { token } = useAuth();
  const [showAuth] = useState(false);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(token),
    retry: false
  });

  // If user wants to sign in, show the auth panel
  if (showAuth && !token) {
    return <AuthPanel />;
  }

  // If user is logged in and data is loading
  if (token && meQuery.isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/triads" element={<TriadExplorer />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
