import React, { InputHTMLAttributes, useId } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function TextInput({
  label,
  id,
  className = '',
  ...props
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`input-group ${className}`}>
      {/* input must come BEFORE label so CSS sibling selector works */}
      <input
        id={inputId}
        className="input-field"
        placeholder=" "
        {...props}
      />
      <label className="input-label" htmlFor={inputId}>
        {label}
      </label>
    </div>
  );
}
