'use client';

import { useState } from 'react';
import MobileMenu from './social/MobileMenu';

interface ClientLayoutWrapperProps {
    children: React.ReactNode;
    user?: any;
}

export default function ClientLayoutWrapper({ children, user }: ClientLayoutWrapperProps) {
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <>
            {children}
            <MobileMenu
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
                user={user}
            />
        </>
    );
}
