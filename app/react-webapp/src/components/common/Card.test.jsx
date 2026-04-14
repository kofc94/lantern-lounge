import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Card from './Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Card variant="default">Default Variant</Card>);
    expect(screen.getByText('Default Variant')).toHaveClass('p-8');

    rerender(<Card variant="event">Event Variant</Card>);
    expect(screen.getByText('Event Variant')).toHaveClass('p-6');
  });

  it('handles clicks', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable Card</Card>);
    
    fireEvent.click(screen.getByText('Clickable Card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Clickable Card')).toHaveClass('cursor-pointer');
  });

  it('renders an image when imageUrl is provided', () => {
    render(<Card imageUrl="/test-image.jpg" imageAlt="Test Alt">With Image</Card>);
    const img = screen.getByAltText('Test Alt');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('removes hover classes when hover is false', () => {
    const { rerender } = render(<Card hover={true}>Hover True</Card>);
    expect(screen.getByText('Hover True')).toHaveClass('hover:transform');

    rerender(<Card hover={false}>Hover False</Card>);
    expect(screen.getByText('Hover False')).not.toHaveClass('hover:transform');
  });

  it('renders Card subcomponents', () => {
    render(
      <Card>
        <Card.Header>Header Content</Card.Header>
        <Card.Body>Body Content</Card.Body>
        <Card.Footer>Footer Content</Card.Footer>
      </Card>
    );

    expect(screen.getByText('Header Content')).toHaveClass('mb-4');
    expect(screen.getByText('Body Content')).toHaveClass('mb-4');
    expect(screen.getByText('Footer Content')).toHaveClass('mt-6');
  });
});
