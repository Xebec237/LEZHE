import { cn } from '@/lib/cn';

/** Avatar par initiales (pas d'upload d'image au MVP). */
export default function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-11 h-11 text-base', lg: 'w-16 h-16 text-xl' };

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF7A59] to-[#FFB84D] text-white font-bold shrink-0',
        sizes[size],
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
}
