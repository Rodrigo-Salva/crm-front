import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-gray-400 ${
            error ? 'border-[var(--danger)]' : 'border-[var(--border)] hover:border-[var(--celeste-400)]'
          } ${className ?? ''}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
