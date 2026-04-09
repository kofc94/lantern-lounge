import { AuthProvider } from './contexts/AuthContext';
import useAuth from './hooks/useAuth';
import Layout from './components/layout/Layout';
import CheckIn from './pages/CheckIn';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isStaff, loading } = useAuth();

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
