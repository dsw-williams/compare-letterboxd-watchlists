import { cn } from '@/lib/utils';

interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export default function IconButton({ children, onClick, disabled, title, className }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-text-secondary transition-colors duration-150',
        className
      )}
    >
      {children}
    </button>
  );
}
