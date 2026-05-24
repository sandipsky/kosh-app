import { Center, Loader } from '@mantine/core';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './contexts/AuthContext';
import { ContributionsPage } from './pages/ContributionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { MembersPage } from './pages/MembersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { StrategyPage } from './pages/StrategyPage';
import { useAppStore } from './store/useAppStore';

function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    const unsubscribe = hydrate();
    return () => unsubscribe();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/contributions" element={<ContributionsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/investments" element={<InvestmentsPage />} />
          <Route path="/strategy" element={<StrategyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
}

export default App;
