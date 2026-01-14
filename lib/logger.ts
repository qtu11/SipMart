/**
 * Production-safe logging utility
 * Replaces console.log/error with proper logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV !== 'production';

    private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
        };
    }

    private writeLog(entry: LogEntry): void {
        if (this.isDevelopment) {
            const color = {
                info: '\x1b[36m',
                warn: '\x1b[33m',
                error: '\x1b[31m',
                debug: '\x1b[35m',
            }[entry.level];

            const reset = '\x1b[0m';
            // eslint-disable-next-line no-console
            console.log(
                `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`,
                entry.context ? entry.context : ''
            );
        } else {
            // In production, write to structured logging service
            if (entry.level === 'error') {
                // eslint-disable-next-line no-console
                console.error(JSON.stringify(entry));
            }
        }
    }

    private normalizeContext(context?: unknown): Record<string, unknown> | undefined {
        if (context === undefined || context === null) return undefined;
        if (typeof context === 'object') {
            // Handle Error objects
            if (context instanceof Error) {
                return {
                    name: context.name,
                    message: context.message,
                    stack: context.stack
                };
            }
            // Handle objects with message property (like PostgrestError)
            if ('message' in context) {
                return { ...context as Record<string, unknown> };
            }
            return context as Record<string, unknown>;
        }
        return { value: context };
    }

    info(message: string, context?: unknown): void {
        this.writeLog(this.formatLog('info', message, this.normalizeContext(context)));
    }

    warn(message: string, context?: unknown): void {
        this.writeLog(this.formatLog('warn', message, this.normalizeContext(context)));
    }

    error(message: string, context?: unknown): void {
        this.writeLog(this.formatLog('error', message, this.normalizeContext(context)));
    }

    debug(message: string, context?: unknown): void {
        if (this.isDevelopment) {
            this.writeLog(this.formatLog('debug', message, this.normalizeContext(context)));
        }
    }

    // Payment-specific logging
    payment = {
        info: (message: string, data?: Record<string, unknown>) => {
            this.info(`[PAYMENT] ${message}`, data);
        },
        error: (message: string, data?: Record<string, unknown>) => {
            this.error(`[PAYMENT] ${message}`, data);
        },
        success: (transactionCode: string, userId: string, amount: number) => {
            this.info('[PAYMENT] Transaction success', { transactionCode, userId, amount });
        },
        failed: (transactionCode: string, reason: string) => {
            this.warn(`[PAYMENT] Transaction failed: ${reason}`, { transactionCode });
        },
    };

    // VNPay-specific logging
    vnpay = {
        ipnReceived: (txnRef: string, responseCode: string) => {
            this.info('[VNPAY] IPN received', { txnRef, responseCode });
        },
        ipnProcessed: (txnRef: string, status: 'success' | 'failed' | 'duplicate') => {
            this.info(`[VNPAY] IPN processed: ${status}`, { txnRef, status });
        },
        signatureInvalid: (ip: string) => {
            this.warn('[VNPAY] Invalid signature', { ip });
        },
        ipBlocked: (ip: string) => {
            this.warn('[VNPAY] Blocked non-VNPay IP', { ip });
        },
    };
}

export const logger = new Logger();

