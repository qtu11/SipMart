import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gradient-to-b from-primary-50 to-white">
            <AdminSidebar />
            <div className="flex-1 md:ml-0 min-w-0">
                {children}
            </div>
        </div>
    );
}
