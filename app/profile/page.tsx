'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, GraduationCap, Calendar, Award, Edit2, Camera, LogOut,
  Shield, AlertTriangle, CheckCircle, Clock, XCircle, Leaf, Droplets, Zap,
  Eye, EyeOff, MapPin, Phone
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getCurrentUserAsync, onAuthChange, signOutUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase';
import SocialLayout from '@/components/social/SocialLayout';
import UserAvatar from '@/components/ui/UserAvatar';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUserAsync();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);

        // Fetch user data from API
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) return;

          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data', error);
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth', error);
        router.push('/auth/login');
        setLoading(false);
      }
    };

    checkAuth();

    const unsubscribe = onAuthChange(async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success('Đã đăng xuất thành công');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Đăng xuất thất bại');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const userId = (user as any).id || (user as any).user_id;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Upload failed');

      setUserData((prev: any) => ({ ...prev, avatar: data.avatarUrl }));
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // State for edit mode - moved up to avoid conditional hook call error
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kycStatus = userData?.kycStatus || 'none';
  const toggleEdit = () => {
    if (isEditing) {
      // Cancel logic if needed, or just switch back
      setIsEditing(false);
      setFormData(userData); // Reset to current data
    } else {
      setFormData({
        displayName: userData?.displayName || user?.displayName || '',
        full_name: userData?.fullName || '',
        phone_number: userData?.phoneNumber || '',
        address: userData?.address || '',
        province: userData?.province || '',
        is_profile_public: userData?.isProfilePublic ?? true
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          fullName: formData.full_name,
          phoneNumber: formData.phone_number,
          address: formData.address,
          province: formData.province,
          isProfilePublic: formData.is_profile_public
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setUserData(updated);
        setIsEditing(false);
        toast.success('Cập nhật hồ sơ thành công!');
      } else {
        toast.error('Có lỗi xảy ra khi lưu hồ sơ');
      }

    } catch (e) {
      console.error(e);
      toast.error('Lỗi kết nối');
    }
  };

  return (
    <SocialLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-600 to-teal-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="leaf-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M20 0C10 0 0 10 0 20s10 20 20 20 20-10 20-20S30 0 20 0zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#leaf-pattern)" />
            </svg>
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg relative overflow-hidden">
                <div className="w-full h-full">
                  <UserAvatar
                    user={userData || user}
                    className="w-full h-full"
                  />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="absolute bottom-1 right-1 w-9 h-9 bg-white text-primary-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition cursor-pointer disabled:opacity-70 z-10"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                {isEditing ? (
                  <input
                    className="text-gray-900 text-2xl font-bold rounded-lg px-3 py-1 bg-white/90 focus:outline-none w-full md:w-auto"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Tên hiển thị"
                  />
                ) : (
                  <h2 className="text-3xl font-bold">
                    {userData?.displayName || user?.displayName || 'Người dùng'}
                  </h2>
                )}
                {userData?.kycVerified && (
                  <Shield className="w-6 h-6 text-green-300 fill-current" />
                )}
              </div>
              <p className="text-primary-100 mb-4 font-medium">{userData?.email || user?.email}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                  <span className="text-xl">
                    {userData?.rankLevel === 'seed' ? '🌱' :
                      userData?.rankLevel === 'sprout' ? '🌿' :
                        userData?.rankLevel === 'sapling' ? '🌳' :
                          userData?.rankLevel === 'tree' ? '🌲' : '🌍'}
                  </span>
                  <span className="font-semibold capitalize text-sm">{userData?.rankLevel || 'Seed'} Rank</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  <span className="font-bold">{userData?.greenPoints || 0}</span>
                  <span className="text-sm opacity-90">Points</span>
                </div>

                {/* Visibility Badge */}
                <div onClick={() => isEditing && setFormData({ ...formData, is_profile_public: !formData.is_profile_public })}
                  className={`rounded-full px-4 py-1.5 flex items-center gap-2 cursor-pointer transition-colors ${(isEditing ? formData.is_profile_public : userData?.isProfilePublic) !== false
                    ? 'bg-blue-500/30 text-white'
                    : 'bg-red-500/30 text-white'
                    }`}>
                  {(isEditing ? formData.is_profile_public : userData?.isProfilePublic) !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span className="text-sm font-semibold">
                    {(isEditing ? formData.is_profile_public : userData?.isProfilePublic) !== false ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 p-4 flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={toggleEdit} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition text-white">
                    <XCircle className="w-5 h-5" />
                  </button>
                  <button onClick={handleSave} className="p-2 bg-green-400 text-white rounded-full hover:bg-green-500 transition shadow-lg">
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEdit}
                  className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors text-white"
                  title="Chỉnh sửa hồ sơ"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors ml-2"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* KYC Banner */}
        {!userData?.kycVerified && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`rounded-2xl p-4 border border-l-4 shadow-sm flex items-start gap-4 ${kycStatus === 'pending' ? 'bg-yellow-50 border-yellow-200 border-l-yellow-500' :
              kycStatus === 'rejected' ? 'bg-red-50 border-red-200 border-l-red-500' :
                'bg-blue-50 border-blue-200 border-l-blue-500'
              }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {kycStatus === 'pending' ? <Clock className="w-6 h-6 text-yellow-600" /> :
                kycStatus === 'rejected' ? <XCircle className="w-6 h-6 text-red-600" /> :
                  <Shield className="w-6 h-6 text-blue-600" />}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${kycStatus === 'pending' ? 'text-yellow-800' :
                kycStatus === 'rejected' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                {kycStatus === 'pending' ? 'Hồ sơ đang chờ duyệt' :
                  kycStatus === 'rejected' ? 'Xác minh thất bại' :
                    'Xác minh danh tính (eKYC)'}
              </h3>
              <p className={`text-sm mt-1 ${kycStatus === 'pending' ? 'text-yellow-700' :
                kycStatus === 'rejected' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                {kycStatus === 'pending' ? 'Chúng tôi đang xem xét hồ sơ của bạn. Vui lòng quay lại sau.' :
                  kycStatus === 'rejected' ? 'Hồ sơ của bạn chưa đạt yêu cầu. Vui lòng thử lại.' :
                    'Xác minh ngay để mở khóa tính năng Ví điện tử, Mượn ly và nhận 100 Green Points.'}
              </p>
              {kycStatus !== 'pending' && (
                <Link
                  href="/kyc"
                  className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${kycStatus === 'rejected'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {kycStatus === 'rejected' ? 'Thử lại ngay' : 'Xác minh ngay'}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Real Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            icon={<Leaf className="w-6 h-6 text-green-600" />}
            label="Ly đã cứu"
            value={userData?.totalCupsSaved || 0}
            subtext="Tương đương 2 cây xanh"
            color="green"
            delay={0.1}
          />
          <StatsCard
            icon={<Droplets className="w-6 h-6 text-blue-600" />}
            label="Nhựa giảm thiểu"
            value={`${userData?.totalPlasticReduced || 0}g`}
            subtext="Góp phần bảo vệ đại dương"
            color="blue"
            delay={0.2}
          />
          <StatsCard
            icon={<Zap className="w-6 h-6 text-amber-600" />}
            label="Chuỗi ngày xanh"
            value="3 ngày"
            subtext="Giữ vững phong độ nhé!"
            color="amber"
            delay={0.3}
          />
        </div>

        {/* Detailed Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Thông tin cá nhân</h3>
            {!isEditing && (
              <button
                onClick={toggleEdit}
                className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1">
                <Edit2 className="w-4 h-4" /> Sửa
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Email - Always Read Only */}
            <InfoRow icon={<Mail className="w-5 h-5" />} label="Email" value={userData?.email || user?.email} />

            {/* School Info */}
            {userData?.studentId ? (
              <InfoRow icon={<GraduationCap className="w-5 h-5" />} label="Mã sinh viên" value={userData.studentId} />
            ) : null}

            {/* Full Name - eKYC or Manual */}
            {isEditing ? (
              <EditRow
                icon={<User className="w-5 h-5" />}
                label="Họ và tên đầy đủ"
                value={formData.full_name}
                onChange={(v: string) => setFormData({ ...formData, full_name: v })}
                placeholder="Nguyễn Văn A"
              />
            ) : (
              <InfoRow icon={<User className="w-5 h-5" />} label="Họ và tên" value={userData?.fullName || 'Chưa cập nhật'} />
            )}

            {/* Phone Number */}
            {isEditing ? (
              <EditRow
                icon={<Phone className="w-5 h-5" />}
                label="Số điện thoại"
                value={formData.phone_number}
                onChange={(v: string) => setFormData({ ...formData, phone_number: v })}
                placeholder="0909xxxxxx"
              />
            ) : (
              <InfoRow icon={<Phone className="w-5 h-5" />} label="Số điện thoại" value={userData?.phoneNumber || 'Chưa cập nhật'} />
            )}

            {/* Address */}
            {isEditing ? (
              <EditRow
                icon={<MapPin className="w-5 h-5" />}
                label="Địa chỉ chi tiết"
                value={formData.address}
                onChange={(v: string) => setFormData({ ...formData, address: v })}
                placeholder="Số 123, đường..."
              />
            ) : (
              <InfoRow icon={<MapPin className="w-5 h-5" />} label="Địa chỉ" value={userData?.address || 'Chưa cập nhật'} />
            )}

            {/* Province - Simplification for now, using text input but should be select in advanced version */}
            {isEditing ? (
              <EditRow
                icon={<MapPin className="w-5 h-5" />}
                label="Tỉnh / Thành phố"
                value={formData.province}
                onChange={(v: string) => setFormData({ ...formData, province: v })}
                placeholder="Hồ Chí Minh"
              />
            ) : (
              <InfoRow icon={<MapPin className="w-5 h-5" />} label="Khu vực" value={userData?.province || 'Chưa cập nhật'} />
            )}


            <InfoRow
              icon={<Calendar className="w-5 h-5" />}
              label="Ngày tham gia"
              value={userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            />

            <div className="flex items-center gap-4 py-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Trạng thái xác minh</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {userData?.kycVerified ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Đã xác minh
                    </span>
                  ) : (
                    <span className="text-gray-600 font-medium">Chưa xác minh</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SocialLayout>
  );
}

function EditRow({ icon, label, value, onChange, placeholder }: any) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-50">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-primary-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function StatsCard({ icon, label, value, subtext, color, delay }: any) {
  const bgColors: any = {
    green: 'bg-green-50 border-green-100',
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
  };
  const iconBgColors: any = {
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    amber: 'bg-amber-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl p-5 border ${bgColors[color] || 'bg-white border-gray-100'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBgColors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-2">{subtext}</p>
      </div>
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
