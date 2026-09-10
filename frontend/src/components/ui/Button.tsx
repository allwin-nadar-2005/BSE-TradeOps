import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'px-4 py-2 text-sm font-medium rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-brass-500 text-ink-950 hover:bg-brass-400'
      : 'bg-transparent text-paper-100 border border-ink-600 hover:border-brass-500';

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
