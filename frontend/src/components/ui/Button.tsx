'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-[#FF7A59] hover:bg-[#E86343] text-white shadow-sm',
  secondary: 'bg-white hover:bg-[#FFE8DC] text-[#2E241F] border border-[#F3E3D6]',
  ghost: 'text-[#83726A] hover:text-[#2E241F] hover:bg-[#FFF9F3]',
  success: 'bg-[#2BB673] hover:bg-[#23a064] text-white shadow-sm',
  danger: 'bg-[#FBE7E5] hover:bg-[#E2645A] text-[#B5433A] hover:text-white border border-[#E2645A]/30',
};

const SIZES: Record<Size, string> = {
  sm: 'text-sm px-3 py-2 rounded-xl gap-1.5',
  md: 'text-sm px-5 py-3 rounded-xl gap-2',
  lg: 'text-base px-6 py-4 rounded-2xl gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A59] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF9F3] disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  );
});

export default Button;
