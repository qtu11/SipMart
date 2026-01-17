import { Toaster } from 'react-hot-toast';

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout excludes the global Footer for the messages page
    return (
        <>
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#fff',
                        color: '#1f2937',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                    },
                }}
            />
        </>
    );
}
