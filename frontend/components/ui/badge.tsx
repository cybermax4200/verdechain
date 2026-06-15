import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300': variant === 'default',
          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300': variant === 'secondary',
          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': variant === 'destructive',
          'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300': variant === 'outline',
        },
        className,
      )}
      {...props}
    />
  );
}
