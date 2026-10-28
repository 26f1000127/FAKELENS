import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full bg-[#0E1322] border rounded-xl py-2.5 text-xs text-white placeholder-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-12' : 'pr-3.5'} ${
            error
              ? 'border-red-500/60 focus:ring-red-500'
              : 'border-white/10 hover:border-purple-500/30'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center">{rightElement}</div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-[11px] text-red-400 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

