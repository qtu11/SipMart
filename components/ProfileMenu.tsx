'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Bell, HelpCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { signOutUser } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ProfileMenuProps {
  user: any;
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Đăng xuất thành công');
      router.push('/');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center hover:bg-primary-200 transition"
      >
        <User className="w-5 h-5 text-primary-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-12 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-dark-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-dark-100">
                <p className="font-semibold text-dark-800">{user?.displayName || 'User'}</p>
                <p className="text-sm text-dark-500">{user?.email}</p>
              </div>

              <div className="py-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition"
                >
                  <User className="w-5 h-5 text-dark-500" />
                  <span className="text-dark-700">Hồ sơ</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition"
                >
                  <Settings className="w-5 h-5 text-dark-500" />
                  <span className="text-dark-700">Cài đặt</span>
                </Link>

                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition"
                >
                  <Bell className="w-5 h-5 text-dark-500" />
                  <span className="text-dark-700">Thông báo</span>
                </Link>

                <Link
                  href="/help"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-primary-50 transition"
                >
                  <HelpCircle className="w-5 h-5 text-dark-500" />
                  <span className="text-dark-700">Trợ giúp</span>
                </Link>

                <div className="border-t border-dark-100 my-2" />

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

