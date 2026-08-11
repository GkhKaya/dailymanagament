import React from 'react';

export function LoadingSpinner({ size }: { size?: 'sm' | 'md' | 'lg' }) {
  if (size === 'sm') {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white/80"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
    </div>
  );
}
