'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Check, X, Users, UserCheck, ArrowLeft, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

interface Friend {
  userId: string;
  displayName?: string;
  avatar?: string;
  email: string;
}

interface FriendRequest {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending';
  createdAt: Date;
  fromUser?: Friend;
  toUser?: Friend;
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'requests' | 'friends'>('search');
  const [searchStudentId, setSearchStudentId] = useState('');
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId((user as any).id || (user as any).user_id);
    };
    checkUser();
  }, [router]);

  const loadFriendRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/friends/list?userId=${userId}&type=requests`);
      const data = await res.json();
      if (data.success) {
        // Load user info for each request
        const requestsWithUsers = await Promise.all(
          data.requests.map(async (req: FriendRequest) => {
            try {
              const userRes = await fetch(`/api/friends/user-info?userId=${req.fromUserId}`);
              const userData = await userRes.json();
              return {
                ...req,
                fromUser: userData.success ? userData.user : undefined,
              };
            } catch {
              return req;
            }
          })
        );
        setFriendRequests(requestsWithUsers);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error loading friend requests:', error);
    }
  }, [userId]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/friends/list?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setFriends(data.friends);
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error loading friends:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadFriendRequests();
      loadFriends();
    }
  }, [userId, loadFriendRequests, loadFriends]);

  const handleSearch = async () => {
    if (!searchStudentId.trim()) {
      toast.error('Vui lòng nhập mã sinh viên');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/friends/search?studentId=${searchStudentId.trim()}`);
      const data = await res.json();

      if (data.success) {
        if (data.user.userId === userId) {
          toast.error('Đây là tài khoản của bạn');
          setSearchResult(null);
        } else {
          setSearchResult(data.user);
        }
      } else {
        toast.error('Không tìm thấy người dùng');
        setSearchResult(null);
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi tìm kiếm');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (toUserId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: userId, toUserId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Đã gửi lời mời kết bạn');
        setSearchResult(null);
        setSearchStudentId('');
      } else {
        toast.error(data.error || 'Không thể gửi lời mời');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi gửi lời mời');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Đã chấp nhận lời mời kết bạn');
        loadFriendRequests();
        loadFriends();
      } else {
        toast.error(data.error || 'Không thể chấp nhận');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi chấp nhận');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40 border-b border-primary-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Bạn bè
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 bg-white rounded-2xl p-2 shadow-soft">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'search'
              ? 'bg-primary-500 text-white'
              : 'text-dark-600 hover:bg-primary-50'
              }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Tìm kiếm
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all relative ${activeTab === 'requests'
              ? 'bg-primary-500 text-white'
              : 'text-dark-600 hover:bg-primary-50'
              }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Lời mời
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all ${activeTab === 'friends'
              ? 'bg-primary-500 text-white'
              : 'text-dark-600 hover:bg-primary-50'
              }`}
          >
            <UserCheck className="w-4 h-4 inline mr-2" />
            Bạn bè ({friends.length})
          </button>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-soft p-6"
          >
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={searchStudentId}
                  onChange={(e) => setSearchStudentId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Nhập mã sinh viên..."
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-dark-100 text-white placeholder:text-dark-400"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition disabled:opacity-50"
              >
                {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </button>
            </div>

            {searchResult && (
              <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    {searchResult.displayName?.[0]?.toUpperCase() || searchResult.email[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900">{searchResult.displayName || searchResult.email}</h3>
                    <p className="text-sm text-dark-600">{searchResult.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendRequest(searchResult.userId)}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {friendRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
                <UserPlus className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                <p className="text-dark-600">Chưa có lời mời kết bạn nào</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.requestId} className="bg-white rounded-2xl shadow-soft p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {request.fromUser?.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-900">
                        {request.fromUser?.displayName || 'Người dùng'}
                      </h3>
                      <p className="text-sm text-dark-600">Muốn kết bạn với bạn</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.requestId)}
                      disabled={loading}
                      className="w-10 h-10 bg-green-500 text-white rounded-xl hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {friends.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
                <Users className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                <p className="text-dark-600">Bạn chưa có bạn bè nào</p>
                <p className="text-sm text-dark-500 mt-2">Tìm kiếm bằng mã sinh viên để kết bạn!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.userId} className="bg-white rounded-2xl shadow-soft p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      {friend.displayName?.[0]?.toUpperCase() || friend.email[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-900">{friend.displayName || friend.email}</h3>
                      <p className="text-sm text-dark-600">{friend.email}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

