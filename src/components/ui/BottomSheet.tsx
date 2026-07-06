import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [render, setRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const onAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!render) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`relative w-full max-w-2xl bg-[var(--surface-container)] rounded-t-3xl border-t border-[rgba(255,255,255,0.05)] shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pointer-events-auto transition-transform duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onTransitionEnd={onAnimationEnd}
      >
        {/* Handle bar */}
        <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose} style={{cursor: 'pointer'}}>
          <div className="w-12 h-1.5 rounded-full bg-[rgba(255,255,255,0.2)]" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <h2 className="text-title font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <X size={20} className="text-[var(--on-surface-variant)]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
