import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Visible Modal">
        Visible Content
      </Modal>
    );
    expect(screen.getByText('Visible Modal')).toBeInTheDocument();
    expect(screen.getByText('Visible Content')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Closable Modal">
        Content
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Backdrop Click">
        Content
      </Modal>
    );
    
    // The overlay is the direct parent of the modal dialog, we can find it by its fixed classes or clicking the parent
    // However, it's easier to fire click on the first child of body which is the portal content
    const overlay = screen.getByText('Content').parentElement.parentElement;
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when modal content is clicked', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Content Click">
        Content
      </Modal>
    );
    
    fireEvent.click(screen.getByText('Content'));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Key">
        Content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('sets body overflow to hidden when open and resets on close', () => {
    const { rerender, unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Overflow">
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Overflow">
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('unset');

    // Make sure unmount also resets it if it was open
    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Overflow">
        Content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('applies correct theme and size classes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Themed" theme="vintage" size="sm">
        Content
      </Modal>
    );
    
    // Parent of the title is the modal content box
    const modalBox = screen.getByText('Themed').parentElement.parentElement;
    expect(modalBox).toHaveClass('bg-neutral-paper');
    expect(modalBox).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen={true} onClose={() => {}} title="Themed" theme="dark" size="lg">
        Content
      </Modal>
    );
    expect(modalBox).toHaveClass('bg-dark-light');
    expect(modalBox).toHaveClass('max-w-2xl');
  });
});
