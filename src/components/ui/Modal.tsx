import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeStyles: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  full: 'md:max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black transition-opacity duration-200',
          animating ? 'opacity-50' : 'opacity-0'
        )}
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative w-full bg-white transition-all duration-200 ease-out',
          // Mobile: full-screen slide-up
          'h-[calc(100dvh-2rem)] rounded-t-2xl mt-auto',
          // Desktop: centered dialog
          'md:h-auto md:max-h-[85vh] md:rounded-2xl md:m-4 md:mt-0',
          sizeStyles[size],
          animating
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto max-h-[calc(100dvh-8rem)] md:max-h-[calc(85vh-4rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
