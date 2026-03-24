import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import JoinUs from './pages/JoinUs';
import Events from './pages/Events';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';

/**
 * Main App Component with Routing
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="join-us" element={<JoinUs />} />
            <Route path="events" element={<Events />} />
            <Route path="about" element={<About />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
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
