import React, { InputHTMLAttributes, useId } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ 
  label,
  id,
  className = '', 
  ...props 
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`relative flex items-center ${className}`}>
      <label htmlFor={inputId} className="flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          id={inputId}
          className="peer sr-only"
          {...props}
        />
        <div className="w-4 h-4 border border-[var(--outline)] rounded flex items-center justify-center peer-checked:bg-[var(--primary)] peer-checked:border-[var(--inverse-primary)] transition-colors cursor-pointer">
          <Check size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
        </div>
        {label && (
          <span className="ml-3 text-[16px] text-[var(--on-surface-variant)]">
            {label}
          </span>
        )}
      </label>
    </div>
  );
}
