import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';
import Card from './Card';

describe('Common Components', () => {
  describe('Button', () => {
    it('renders with children', () => {
      const { getByText } = render(<Button>Click Me</Button>);
      expect(getByText('Click Me')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      const { getByText } = render(<Button onClick={handleClick}>Click Me</Button>);
      fireEvent.click(getByText('Click Me'));
      expect(handleClick).toHaveBeenCalled();
    });

    it('can be disabled', () => {
      const handleClick = vi.fn();
      const { getByText } = render(<Button disabled onClick={handleClick}>Click Me</Button>);
      const button = getByText('Click Me');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Card', () => {
    it('renders children', () => {
      const { getByText } = render(<Card>Card Content</Card>);
      expect(getByText('Card Content')).toBeInTheDocument();
    });

    it('renders subcomponents', () => {
      const { getByText } = render(
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>Body</Card.Body>
          <Card.Footer>Footer</Card.Footer>
        </Card>
      );
      expect(getByText('Header')).toBeInTheDocument();
      expect(getByText('Body')).toBeInTheDocument();
      expect(getByText('Footer')).toBeInTheDocument();
    });
  });
});
