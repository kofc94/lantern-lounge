/**
 * Footer component - consistent footer across all pages
 */
const Footer = () => {
  return (
    <footer className="bg-dark-light border-t border-gray-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} The Lantern Lounge. All rights reserved.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Lexington's best-kept secret!
        </p>
      </div>
    </footer>
  );
};

export default Footer;
