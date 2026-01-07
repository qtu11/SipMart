import { createClient } from './client';

/**
 * Get auth headers with Bearer token for API calls
 * Use this in all admin API fetch requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
}

/**
 * Authenticated fetch wrapper for API calls
 */
export async function authFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const headers = await getAuthHeaders();

    return fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    });
}
