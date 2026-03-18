import { cn } from '@/lib/utils';

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { className?: string };

export default function InputField({ className, ...props }: InputFieldProps) {
  return (
    <input
      className={cn(
        'bg-bg-input border border-border-subtle rounded-lg text-text-primary text-sm outline-none',
        className
      )}
      {...props}
    />
  );
}
