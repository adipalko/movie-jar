import { type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HouseholdProvider, useHousehold } from './contexts/HouseholdContext';
import { ContentTypeProvider } from './contexts/ContentTypeContext';
import { AuthScreen } from './components/AuthScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { HouseholdSelection } from './components/HouseholdSelection';
import { HomeScreen } from './components/HomeScreen';
import { WatchedMoviesScreen } from './components/WatchedMoviesScreen';
import { InviteAcceptance } from './components/InviteAcceptance';
import { Layout } from './components/Layout';
import { AnalyticsTracker } from './components/AnalyticsTracker';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // If user exists but no app_users row, show profile setup
  if (!appUser) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
}

function HouseholdRoute({ children }: { children: ReactNode }) {
  const { activeHousehold, loading } = useHousehold();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!activeHousehold) {
    return <HouseholdSelection />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HouseholdRoute>
              <Layout>
                <HomeScreen />
              </Layout>
            </HouseholdRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/watched"
        element={
          <ProtectedRoute>
            <HouseholdRoute>
              <Layout>
                <WatchedMoviesScreen />
              </Layout>
            </HouseholdRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invite/:id"
        element={
          <ProtectedRoute>
            <InviteAcceptance />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AnalyticsTracker />
      <AuthProvider>
        <HouseholdProvider>
          <ContentTypeProvider>
            <AppRoutes />
          </ContentTypeProvider>
        </HouseholdProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
