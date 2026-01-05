import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

type ApiResponse<T = any> = {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    meta?: any;
};

/**
 * Standardized success response
 */
export function jsonResponse<T>(data: T, message?: string, status: number = 200) {
    const body: ApiResponse<T> = {
        success: true,
        data,
        message,
    };
    return NextResponse.json(body, { status });
}

/**
 * Standardized error response
 */
export function errorResponse(error: unknown, status: number = 500) {
    let errorMessage = 'Internal Server Error';
    let errorDetails: any = null;

    if (error instanceof ZodError) {
        errorMessage = 'Validation Error';
        errorDetails = (error as any).errors.map((e: any) => ({
            path: e.path.join('.'),
            message: e.message
        }));
        status = 400; // Force 400 for validation errors
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    // Log strict 500 errors
    if (status >= 500) {
        logger.error('API Error', { error });
    }

    return NextResponse.json(
        {
            success: false,
            error: errorMessage,
            details: errorDetails
        },
        { status }
    );
}

/**
 * Helper to validate authentication result
 */
export function unauthorizedResponse(message: string = 'Unauthorized - Please login first') {
    return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
    );
}
