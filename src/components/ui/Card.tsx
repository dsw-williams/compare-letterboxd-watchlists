import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-bg-card border border-border-subtle rounded-2xl', className)}>
      {children}
    </div>
  );
}
