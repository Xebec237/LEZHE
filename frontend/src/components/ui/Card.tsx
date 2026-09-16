import { cn } from '@/lib/cn';

export default function Card({
  as: Tag = 'section',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' | 'header' | 'li' }) {
  return (
    <Tag className={cn('bg-white rounded-3xl border border-[#F3E3D6] shadow-card p-6 sm:p-8', className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#2E241F] flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}
