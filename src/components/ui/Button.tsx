import React, { ButtonHTMLAttributes } from 'react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  withArrow?: boolean;
}

export function Button({ 
  children, 
  withArrow = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`btn-primary flex justify-center items-center gap-2 group rounded-full py-4 px-8 text-[14px] font-semibold w-full ${className}`}
      {...props}
    >
      <span>{children}</span>
      {withArrow && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
    </button>
  );
}
