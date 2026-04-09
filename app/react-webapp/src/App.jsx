import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import useAuth from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import JoinUs from './pages/JoinUs';
import Events from './pages/Events';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Help from './pages/Help';
import WalletDownload from './pages/WalletDownload';

/**
 * Component to handle redirect after social login.
 * Cognito redirects back to '/', so we check for an intended destination.
 */
const RedirectHandler = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait until auth state is resolved
    if (!isLoading && isAuthenticated) {
      const redirectPath = sessionStorage.getItem('auth_redirect');
      if (redirectPath) {
        sessionStorage.removeItem('auth_redirect');
        if (redirectPath !== window.location.pathname) {
          console.log(`Restoring session redirect to: ${redirectPath}`);
          navigate(redirectPath, { replace: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return null;
};

/**
 * Main App Component with Routing
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RedirectHandler />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="join-us" element={<JoinUs />} />
            <Route path="events" element={<Events />} />
            <Route path="about" element={<About />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="admin" element={<Admin />} />
            <Route path="register" element={<Register />} />
            <Route path="help" element={<Help />} />
            <Route path="wallet-download" element={<WalletDownload />} />
            {/* Redirect old calendar route to events */}
            <Route path="calendar" element={<Navigate to="/events" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
