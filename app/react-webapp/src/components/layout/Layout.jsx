import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Layout component - wraps all pages with Navbar and Footer
 * Eliminates navbar/footer duplication across pages
 */
const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-dark">
      <Navbar />
      {/* Add top margin to account for fixed navbar */}
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
