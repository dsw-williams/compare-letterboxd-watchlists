import { cn } from '@/lib/utils';

interface PillButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function PillButton({ isActive, onClick, children, className }: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full text-13 cursor-pointer transition-all duration-150 border',
        isActive
          ? 'font-semibold border-accent-green bg-accent-green text-text-primary'
          : 'font-normal border-border-subtle bg-transparent text-text-secondary',
        className
      )}
    >
      {children}
    </button>
  );
}
