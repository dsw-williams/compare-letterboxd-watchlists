import { cn } from '@/lib/utils';

interface PrimaryButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'submit' | 'button' | 'reset';
  className?: string;
  onClick?: () => void;
}

export default function PrimaryButton({ children, disabled, type = 'button', className, onClick }: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full h-11 text-text-primary font-bold border-none rounded-lg flex items-center justify-center transition-colors duration-150',
        disabled ? 'bg-accent-green-disabled cursor-not-allowed' : 'bg-accent-green cursor-pointer',
        className
      )}
    >
      {children}
    </button>
  );
}
