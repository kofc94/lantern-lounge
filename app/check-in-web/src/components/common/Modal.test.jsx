import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

// Mock createPortal since we are in a test environment
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createPortal: (node) => node,
  };
});

describe('Modal Component', () => {
  it('renders nothing when isOpen is false', () => {
    const { queryByText } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    );
    expect(queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders content when isOpen is true', () => {
    const { getByText } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(getByText('Test Modal')).toBeInTheDocument();
    expect(getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    const { getByLabelText } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>
    );
    fireEvent.click(getByLabelText('Close modal'));
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    const { getByText } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>
    );
    // The backdrop is the outer div with the onClick handler
    fireEvent.click(getByText('Content').parentElement.parentElement);
    expect(handleClose).toHaveBeenCalled();
  });
});
