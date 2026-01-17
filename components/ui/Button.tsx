import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'default' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-md hover:shadow-lg',
    secondary: 'bg-dark-100 dark:bg-dark-700 text-dark-800 dark:text-white hover:bg-dark-200 dark:hover:bg-dark-600',
    ghost: 'bg-transparent text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    outline: 'bg-transparent border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
    default: 'bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-md hover:shadow-lg',
    destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    className,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <motion.button
            whileHover={!isDisabled ? { scale: 1.02 } : undefined}
            whileTap={!isDisabled ? { scale: 0.98 } : undefined}
            disabled={isDisabled}
            className={cn(
                'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                variantStyles[variant],
                sizeStyles[size],
                fullWidth && 'w-full',
                className
            )}
            {...props}
        >
            {loading && (
                <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {!loading && icon && iconPosition === 'left' && (
                <span className="flex-shrink-0">{icon}</span>
            )}
            <span>{children}</span>
            {!loading && icon && iconPosition === 'right' && (
                <span className="flex-shrink-0">{icon}</span>
            )}
        </motion.button>
    );
}
