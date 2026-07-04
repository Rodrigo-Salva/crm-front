import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants = {
  primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-[0_0_15px_rgba(0,112,243,0.3)] active:scale-95',
  secondary: 'bg-[var(--secondary)] text-[var(--text)] hover:bg-[var(--sidebar-hover)] border border-[var(--border)] shadow-sm active:scale-95',
  danger: 'bg-[var(--danger)] text-white hover:bg-red-600 shadow-sm active:scale-95',
  ghost: 'hover:bg-[var(--sidebar-hover)] text-[var(--text-secondary)] hover:text-[var(--text)] active:scale-95',
  outline: 'bg-transparent text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary-light)] active:scale-95',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className ?? ''}`}
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
