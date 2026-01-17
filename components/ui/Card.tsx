import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'glass' | 'gradient' | 'elevated' | 'bordered';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
    children: React.ReactNode;
    variant?: CardVariant;
    hover?: boolean;
    glow?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700',
    glass: 'bg-white/10 dark:bg-dark-900/30 backdrop-blur-lg border border-white/20 dark:border-dark-700/50',
    gradient: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0',
    elevated: 'bg-white dark:bg-dark-800 shadow-2xl border-0',
    bordered: 'bg-white dark:bg-dark-800 border-2 border-primary-500 dark:border-primary-600',
};

export function Card({
    children,
    variant = 'default',
    hover = false,
    glow = false,
    className,
    ...props
}: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
            transition={{ duration: 0.3 }}
            className={cn(
                'rounded-2xl p-6 transition-all duration-300',
                variantStyles[variant],
                hover && 'cursor-pointer',
                glow && 'shadow-glow hover:shadow-glow-lg',
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)}>
            {children}
        </div>
    );
}

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h3 className={cn('text-lg font-bold text-dark-800 dark:text-white', className)}>
            {children}
        </h3>
    );
}

interface CardDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={cn('text-sm text-dark-500 dark:text-dark-400 mt-1', className)}>
            {children}
        </p>
    );
}

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={cn('text-dark-600 dark:text-dark-300', className)}>
            {children}
        </div>
    );
}

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-dark-100 dark:border-dark-700', className)}>
            {children}
        </div>
    );
}
