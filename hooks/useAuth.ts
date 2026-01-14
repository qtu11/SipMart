import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, onAuthChange, signOutUser } from '@/lib/supabase/auth';

export function useAuth(requireAuth = false) {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Initial fetch
        getCurrentUser().then((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (requireAuth && !currentUser) {
                router.push('/auth/login');
            }
        });

        // Subscription
        const unsubscribe = onAuthChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (requireAuth && !currentUser) {
                router.push('/auth/login');
            }
        });

        return () => unsubscribe();
    }, [requireAuth, router]);

    const signOut = async () => {
        await signOutUser();
        setUser(null);
        router.push('/auth/login');
    };

    return { user, loading, signOut };
}
