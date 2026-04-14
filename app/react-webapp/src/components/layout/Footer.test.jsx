import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer Component', () => {
  it('renders copyright text with the current year', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    expect(screen.getByText(/The Lantern Lounge\. All rights reserved\./i)).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    expect(screen.getByText(/Lexington's best-kept secret!/i)).toBeInTheDocument();
  });

  it('renders a link to the privacy policy', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: /Privacy Policy/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/privacy-policy');
  });
});
