import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [render, setRender] = useState(isOpen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      previouslyFocused.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!isOpen && !render) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center pointer-events-none p-4 sm:p-6" role="presentation">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--surface-container)] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onTransitionEnd={onAnimationEnd}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] shrink-0">
          <h2 id="bottom-sheet-title" className="text-title font-semibold">{title}</h2>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Pencereyi kapat" className="min-h-11 min-w-11 p-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <X size={20} className="text-[var(--on-surface-variant)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
