'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

// Routes that should NOT show the footer
const NO_FOOTER_ROUTES = [
    '/messages',
    '/auth',
];

export default function ConditionalFooter() {
    const pathname = usePathname();

    // Check if current route should hide footer
    const shouldHideFooter = NO_FOOTER_ROUTES.some(route =>
        pathname?.startsWith(route)
    );

    if (shouldHideFooter) {
        return null;
    }

    return <Footer />;
}
