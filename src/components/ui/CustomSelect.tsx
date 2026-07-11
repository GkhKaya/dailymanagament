import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}

export function CustomSelect({ value, onChange, options, placeholder = "Seçiniz...", required = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Hidden native input for required validation if needed, though custom validation is better */}
      {required && (
        <input 
          type="text" 
          required 
          value={value} 
          onChange={() => {}} 
          className="absolute opacity-0 -z-10 w-full h-full pointer-events-none" 
        />
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[rgba(255,255,255,0.03)] border rounded-xl py-4 px-4 text-left flex justify-between items-center transition-all focus:outline-none ${
          isOpen ? 'border-[var(--inverse-primary)] shadow-[0_0_15px_rgba(33,196,93,0.15)]' : 'border-[rgba(255,255,255,0.1)]'
        } ${value ? 'text-white text-body font-medium' : 'text-[var(--on-surface-variant)] text-body'}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown 
          size={20} 
          className={`text-[var(--on-surface-variant)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--inverse-primary)]' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute z-50 w-full mt-2 bg-[#1A1A24] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl overflow-hidden transition-all duration-200 transform origin-top ${
          isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'
        }`}
      >
        <div className="max-h-60 overflow-y-auto thin-scrollbar">
          {options.length === 0 ? (
            <div className="py-4 px-4 text-center text-[var(--on-surface-variant)] text-sm">
              Seçenek bulunamadı
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left py-3 px-4 text-body transition-colors hover:bg-[rgba(255,255,255,0.05)] ${
                  value === option.value ? 'bg-[rgba(33,196,93,0.1)] text-[#4ade80] font-medium' : 'text-white'
                }`}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
