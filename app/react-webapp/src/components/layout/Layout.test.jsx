import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';

// Mock child components to isolate Layout testing
vi.mock('./Navbar', () => ({
  default: () => <div data-testid="mock-navbar">Navbar</div>,
}));

vi.mock('./Footer', () => ({
  default: () => <div data-testid="mock-footer">Footer</div>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="mock-outlet">Page Content</div>,
  };
});

describe('Layout Component', () => {
  it('renders Navbar, Outlet, and Footer', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('applies correct layout classes', () => {
    const { container } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    
    // The root div should have min-h-screen and flex col
    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('min-h-screen');
    expect(rootDiv).toHaveClass('flex-col');

    // Main content area should have flex-1 and padding
    const mainArea = screen.getByTestId('mock-outlet').parentElement;
    expect(mainArea.tagName).toBe('MAIN');
    expect(mainArea).toHaveClass('flex-1');
    expect(mainArea).toHaveClass('pt-20');
  });
});
