'use client';

import { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full px-4 py-3 rounded-xl border bg-[#FFF9F3] text-base text-[#2E241F] placeholder:text-[#83726A]/80 transition focus:outline-none focus:ring-2 focus:ring-[#FFD9C7] disabled:opacity-50';

interface BaseProps {
  label?: string;
  hint?: string;
  error?: string;
}

function Wrapper({
  id,
  label,
  hint,
  error,
  children,
}: BaseProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-[#2E241F]">
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-[#83726A]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-[#B5433A] flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & BaseProps>(
  function Input({ label, hint, error, className, id, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <Wrapper id={fieldId} label={label} hint={hint} error={error}>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(CONTROL, error ? 'border-[#E2645A]' : 'border-[#F3E3D6] focus:border-[#FF7A59]', className)}
          {...props}
        />
      </Wrapper>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps>(
  function Textarea({ label, hint, error, className, id, rows = 4, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <Wrapper id={fieldId} label={label} hint={hint} error={error}>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(CONTROL, error ? 'border-[#E2645A]' : 'border-[#F3E3D6] focus:border-[#FF7A59]', className)}
          {...props}
        />
      </Wrapper>
    );
  },
);

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & BaseProps & { options: { value: string; label: string }[] }
>(function Select({ label, hint, error, className, id, options, ...props }, ref) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'font-medium', error ? 'border-[#E2645A]' : 'border-[#F3E3D6] focus:border-[#FF7A59]', className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
});
