import { AuthProvider } from './contexts/AuthContext';
import useAuth from './hooks/useAuth';
import Layout from './components/layout/Layout';
import CheckIn from './pages/CheckIn';
import Button from './components/common/Button';

// A simple protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isStaff, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lantern-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h1 className="text-4xl font-display font-bold text-white mb-6 uppercase tracking-widest">
          Staff Access <span className="text-accent-gold italic">Required</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          This application is restricted to authorized Lantern Lounge staff and administrators.
        </p>
        <div className="p-8 border-2 border-white/5 bg-white/5 rounded-sm">
          <p className="text-sm text-gray-500 mb-6 font-mono uppercase tracking-tighter">
            Please log in with your staff credentials to continue.
          </p>
          <div className="h-px bg-white/10 w-full mb-6"></div>
          <p className="text-xs text-gray-600 italic">
            Unauthorized access attempts are logged.
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
  )
}

export default App
