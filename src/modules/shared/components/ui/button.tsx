import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-[var(--border)]',
  danger: 'bg-[var(--danger)] text-white hover:bg-red-600 shadow-sm',
  ghost: 'bg-transparent text-gray-500 hover:bg-[var(--sidebar-hover)] hover:text-[var(--celeste-600)]',
  outline: 'bg-white text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary-light)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium',
  md: 'px-4 py-2 text-sm font-medium',
  lg: 'px-5 py-2.5 text-sm font-medium',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
