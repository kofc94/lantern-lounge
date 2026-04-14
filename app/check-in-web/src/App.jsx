import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import useAuth from './hooks/useAuth';
import Layout from './components/layout/Layout';
import CheckIn from './pages/CheckIn';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isStaff, loading } = useAuth();

  useEffect(() => {
    // Handle deep links for OAuth redirects on native mobile
    const setupDeepLinks = async () => {
      CapApp.addListener('appUrlOpen', (data) => {
        // When the app is opened via a custom URL scheme (e.g. after OAuth)
        // we don't need to do much manually as Amplify logic usually catches 
        // the URL changes if configured correctly, but this ensures the 
        // app state is aware of the opening URL.
        console.log('App opened with URL:', data.url);
      });
    };
    setupDeepLinks();
    
    return () => {
      CapApp.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    // Hide splash screen when auth check is finished
    if (!loading) {
      SplashScreen.hide().catch(() => { /* Ignore if not native */ });
    }
  }, [loading]);

  useEffect(() => {
    // Style status bar for native mobile
    const styleStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#1C1917' }); // Match bg-dark
      } catch {
        // Ignore if not native
      }
    };
    styleStatusBar();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lantern-gold" />
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
        <div className="text-center max-w-sm">
          <p className="text-lantern-gold/40 text-xs uppercase tracking-widest font-bold mb-4">
            Restricted
          </p>
          <h1 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Staff Access<br />
            <span className="text-lantern-gold italic">Required</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            This application is for authorized Lantern Lounge staff only.
            Please sign in with your staff credentials using the button above.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Layout>
        <ProtectedRoute>
          <CheckIn />
        </ProtectedRoute>
      </Layout>
    </AuthProvider>
  );
}

export default App;
