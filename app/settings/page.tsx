'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Globe, Shield, Volume2, VolumeX } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'vi',
    sound: true,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
    });

    // Load settings từ localStorage
    const savedSettings = localStorage.getItem('cupsipmart_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    return () => unsubscribe();
  }, [router]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('cupsipmart_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-xl font-semibold text-dark-800">Cài đặt</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-xl border-2 border-dark-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-bold text-dark-800">Thông báo</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-dark-800">Thông báo đẩy</p>
                <p className="text-sm text-dark-500">Nhận thông báo về mượn/trả ly</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.notifications ? 'bg-primary-500' : 'bg-dark-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-xl border-2 border-dark-100"
        >
          <div className="flex items-center gap-3 mb-4">
            {settings.darkMode ? (
              <Moon className="w-6 h-6 text-primary-600" />
            ) : (
              <Sun className="w-6 h-6 text-primary-600" />
            )}
            <h2 className="text-lg font-bold text-dark-800">Giao diện</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-dark-800">Chế độ tối</p>
                <p className="text-sm text-dark-500">Chuyển sang giao diện tối</p>
              </div>
              <button
                onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.darkMode ? 'bg-primary-500' : 'bg-dark-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-xl border-2 border-dark-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-bold text-dark-800">Ngôn ngữ</h2>
          </div>

          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="w-full px-4 py-3 border-2 border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </motion.div>

        {/* Sound */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-xl border-2 border-dark-100"
        >
          <div className="flex items-center gap-3 mb-4">
            {settings.sound ? (
              <Volume2 className="w-6 h-6 text-primary-600" />
            ) : (
              <VolumeX className="w-6 h-6 text-primary-600" />
            )}
            <h2 className="text-lg font-bold text-dark-800">Âm thanh</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-dark-800">Âm thanh thông báo</p>
              <p className="text-sm text-dark-500">Bật/tắt âm thanh khi có thông báo</p>
            </div>
            <button
              onClick={() => handleSettingChange('sound', !settings.sound)}
              className={`w-14 h-8 rounded-full transition-colors ${
                settings.sound ? 'bg-primary-500' : 'bg-dark-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.sound ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-xl border-2 border-dark-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary-600" />
            <h2 className="text-lg font-bold text-dark-800">Bảo mật</h2>
          </div>

          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition">
              <p className="font-semibold text-dark-800">Đổi mật khẩu</p>
              <p className="text-sm text-dark-500">Cập nhật mật khẩu của bạn</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition">
              <p className="font-semibold text-dark-800">Xóa tài khoản</p>
              <p className="text-sm text-dark-500">Xóa vĩnh viễn tài khoản của bạn</p>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

