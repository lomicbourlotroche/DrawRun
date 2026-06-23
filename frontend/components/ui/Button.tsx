import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from '@/components/ui/icons';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'ghost'
    | 'danger'
    | 'success'
    | 'glass'
    | 'outline'
    | 'link'
    | 'default';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      glow = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background';

    const variants = {
      primary: cn(
        'bg-primary-500 text-primary-foreground',
        'hover:bg-primary-600 hover:-translate-y-0.5',
        'active:translate-y-0 active:scale-[0.98]',
        'shadow-button-primary hover:shadow-button-primary-hover',
        'disabled:shadow-none disabled:hover:translate-y-0',
        'transition-all duration-200 ease-smooth',
      ),
      secondary: cn(
        'bg-surface border-2 border-primary-200 text-primary-500',
        'hover:bg-primary-50 hover:border-primary-300',
        'active:scale-[0.98]',
        'disabled:opacity-50',
        'transition-all duration-200 ease-smooth',
      ),
      tertiary: cn(
        'bg-transparent text-primary-500',
        'hover:bg-primary-50',
        'active:scale-[0.98]',
        'transition-all duration-200 ease-smooth',
      ),
      ghost: cn(
        'bg-transparent text-muted',
        'hover:bg-muted/20 hover:text-foreground',
        'active:scale-[0.98]',
        'transition-all duration-200 ease-smooth',
      ),
      danger: cn(
        'bg-danger-500 text-danger-foreground',
        'hover:bg-danger-600 hover:-translate-y-0.5',
        'active:translate-y-0 active:scale-[0.98]',
        'transition-all duration-200 ease-smooth',
      ),
      success: cn(
        'bg-success-500 text-success-foreground',
        'hover:bg-success-600 hover:-translate-y-0.5',
        'active:translate-y-0 active:scale-[0.98]',
        'transition-all duration-200 ease-smooth',
      ),
      glass: cn(
        'bg-surface/70 backdrop-blur-md border border-border text-foreground',
        'hover:bg-surface/90 hover:border-primary-200',
        'active:scale-[0.98]',
        'transition-all duration-200 ease-smooth',
      ),
      outline: cn(
        'bg-transparent border-2 border-primary-500 text-primary-500',
        'hover:bg-primary-50',
        'active:scale-[0.98]',
        'transition-all duration-200 ease-smooth',
      ),
      link: cn(
        'bg-transparent text-primary-500 underline-offset-4',
        'hover:underline hover:text-primary-600',
        'active:scale-[0.98]',
        'p-0 min-h-0',
        'transition-all duration-200 ease-smooth',
      ),
      default: cn(
        'bg-surface border-2 border-primary-200 text-primary-500',
        'hover:bg-primary-50 hover:border-primary-300',
        'active:scale-[0.98]',
        'disabled:opacity-50',
        'transition-all duration-200 ease-smooth',
      ),
    };

    const sizes = {
      xs: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[28px]',
      sm: 'px-3.5 py-2 text-sm gap-2 min-h-[36px]',
      md: 'px-5 py-2.5 text-base gap-2 min-h-[44px]',
      lg: 'px-6 py-3 text-lg gap-2.5 min-h-[48px]',
      xl: 'px-8 py-3.5 text-xl gap-3 min-h-[52px]',
    };

    const glowClass = glow ? 'shadow-glow-primary' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowClass,
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
