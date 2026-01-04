'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Sun, Globe, Shield, Volume2, VolumeX } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
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

  // Translations
  const t: Record<string, any> = {
    vi: {
      settings: 'Cài đặt',
      notifications: 'Thông báo',
      push_notif: 'Thông báo đẩy',
      push_desc: 'Nhận thông báo về mượn/trả ly',
      appearance: 'Giao diện',
      dark_mode: 'Chế độ tối',
      dark_desc: 'Chuyển sang giao diện tối',
      language: 'Ngôn ngữ',
      sound: 'Âm thanh',
      sound_notif: 'Âm thanh thông báo',
      sound_desc: 'Bật/tắt âm thanh khi có thông báo',
      security: 'Bảo mật',
      change_pass: 'Đổi mật khẩu',
      change_pass_desc: 'Cập nhật mật khẩu của bạn',
      delete_acc: 'Xóa tài khoản',
      delete_acc_desc: 'Xóa vĩnh viễn tài khoản của bạn',
    },
    en: {
      settings: 'Settings',
      notifications: 'Notifications',
      push_notif: 'Push Notifications',
      push_desc: 'Receive loan/return notifications',
      appearance: 'Appearance',
      dark_mode: 'Dark Mode',
      dark_desc: 'Switch to dark theme',
      language: 'Language',
      sound: 'Sound',
      sound_notif: 'Notification Sound',
      sound_desc: 'Toggle notification sounds',
      security: 'Security',
      change_pass: 'Change Password',
      change_pass_desc: 'Update your password',
      delete_acc: 'Delete Account',
      delete_acc_desc: 'Permanently delete your account',
    }
  };

  const text = t[settings.language] || t.vi;

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        const unsubscribe = onAuthChange((user) => {
          if (!user) {
            router.push('/auth/login');
          } else {
            setUser(user);
          }
        });
        return () => unsubscribe();
      } else {
        setUser(currentUser);
      }
    };
    checkUser();

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('cupsipmart_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);

      // Apply dark mode immediately
      if (parsedSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [router]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('cupsipmart_settings', JSON.stringify(newSettings));

    // Handle Dark Mode toggle
    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-300">
      <header className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100 dark:border-dark-700">
        <h1 className="text-xl font-semibold text-dark-800 dark:text-white transition-colors">{text.settings}</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border-2 border-dark-100 dark:border-dark-700 transition-colors"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-dark-800 dark:text-white">{text.notifications}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-dark-800 dark:text-white">{text.push_notif}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">{text.push_desc}</p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications', !settings.notifications)}
                className={`w-14 h-8 rounded-full transition-colors ${settings.notifications ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                  }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.notifications ? 'translate-x-7' : 'translate-x-1'
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
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border-2 border-dark-100 dark:border-dark-700 transition-colors"
        >
          <div className="flex items-center gap-3 mb-4">
            {settings.darkMode ? (
              <Moon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            ) : (
              <Sun className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            )}
            <h2 className="text-lg font-bold text-dark-800 dark:text-white">{text.appearance}</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-dark-800 dark:text-white">{text.dark_mode}</p>
                <p className="text-sm text-dark-500 dark:text-dark-400">{text.dark_desc}</p>
              </div>
              <button
                onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
                className={`w-14 h-8 rounded-full transition-colors ${settings.darkMode ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                  }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.darkMode ? 'translate-x-7' : 'translate-x-1'
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
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border-2 border-dark-100 dark:border-dark-700 transition-colors"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-dark-800 dark:text-white">{text.language}</h2>
          </div>

          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="w-full px-4 py-3 border-2 border-dark-200 dark:border-dark-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 dark:text-white transition-colors"
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
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border-2 border-dark-100 dark:border-dark-700 transition-colors"
        >
          <div className="flex items-center gap-3 mb-4">
            {settings.sound ? (
              <Volume2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            ) : (
              <VolumeX className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            )}
            <h2 className="text-lg font-bold text-dark-800 dark:text-white">{text.sound}</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-dark-800 dark:text-white">{text.sound_notif}</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">{text.sound_desc}</p>
            </div>
            <button
              onClick={() => handleSettingChange('sound', !settings.sound)}
              className={`w-14 h-8 rounded-full transition-colors ${settings.sound ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'
                }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.sound ? 'translate-x-7' : 'translate-x-1'
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
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-xl border-2 border-dark-100 dark:border-dark-700 transition-colors"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-dark-800 dark:text-white">{text.security}</h2>
          </div>

          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-primary-50 dark:bg-dark-700 rounded-xl hover:bg-primary-100 dark:hover:bg-dark-600 transition">
              <p className="font-semibold text-dark-800 dark:text-white">{text.change_pass}</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">{text.change_pass_desc}</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-primary-50 dark:bg-dark-700 rounded-xl hover:bg-primary-100 dark:hover:bg-dark-600 transition">
              <p className="font-semibold text-dark-800 dark:text-white">{text.delete_acc}</p>
              <p className="text-sm text-dark-500 dark:text-dark-400">{text.delete_acc_desc}</p>
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

