import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dialog } from '../../src/components/ui/Dialog';

describe('Dialog Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    const overlay = screen.getByTestId('dialog-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when dialog content is clicked', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    const dialogContent = screen.getByText('Dialog content');
    fireEvent.click(dialogContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should handle escape key press', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render with custom size', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog" size="large">
        <div>Dialog content</div>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-4xl');
  });

  it('should render with default medium size', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        <div>Dialog content</div>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('max-w-2xl');
  });
}); 