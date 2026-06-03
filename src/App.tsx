import { Center, Loader } from '@mantine/core';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginScreen } from './components/common/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ContributionsPage } from './pages/ContributionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { LoansPage } from './pages/LoansPage';
import { MembersPage } from './pages/MembersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { StrategyPage } from './pages/StrategyPage';
import { useAppStore } from './store/useAppStore';

function AuthGate() {
  const { authReady, isAuthenticated, currentUser } = useAuth();

  // Wait for Firebase to report the initial auth state.
  if (!authReady) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  // Not signed in → block every page behind the login screen.
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Signed in, but the member profile hasn't loaded yet (e.g. first-run
  // bootstrap of the admin doc). Hold on a loader instead of flashing login.
  if (!currentUser) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/contributions" element={<ContributionsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/strategy" element={<StrategyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

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
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
