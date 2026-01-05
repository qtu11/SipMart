'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Heart, Eye, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUserAsync } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import Image from 'next/image';

interface Story {
  storyId: string;
  userId: string;
  displayName?: string;
  avatar?: string;
  type: 'image' | 'video' | 'achievement' | 'milestone';
  content: string;
  thumbnail?: string;
  achievementType?: 'cup_saved' | 'points' | 'rank_up' | 'challenge';
  achievementData?: any;
  createdAt: Date;
  expiresAt: Date;
  views: string[];
  likes: string[];
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const storyGroupsRef = useRef<Map<string, Story[]>>(new Map());

  const loadStories = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/stories/list?userId=${userId}`);
      const data = await res.json();

      if (data.success) {
        // Group stories by user
        const groups = new Map<string, Story[]>();
        data.stories.forEach((story: Story) => {
          if (!groups.has(story.userId)) {
            groups.set(story.userId, []);
          }
          groups.get(story.userId)!.push(story);
        });

        storyGroupsRef.current = groups;
        setStories(data.stories);
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error loading stories', { error });
      toast.error('Lỗi khi tải stories');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUserAsync();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUserId((user as any).id || (user as any).user_id);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (userId) {
      loadStories();
    }
  }, [userId, loadStories]);

  const nextStory = useCallback(() => {
    const userStories = Array.from(storyGroupsRef.current.values())[currentUserIndex];
    if (currentStoryIndex < (userStories?.length || 0) - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < Array.from(storyGroupsRef.current.values()).length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      setShowStoryViewer(false);
    }
  }, [currentStoryIndex, currentUserIndex]);

  useEffect(() => {
    if (showStoryViewer && stories.length > 0) {
      const timer = setTimeout(() => {
        nextStory();
      }, 5000); // Auto advance after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [showStoryViewer, currentStoryIndex, currentUserIndex, stories, nextStory]);

  const openStoryViewer = (startIndex: number) => {
    setCurrentStoryIndex(0);
    setCurrentUserIndex(startIndex);
    setShowStoryViewer(true);

    // Mark as viewed
    const story = stories[startIndex];
    if (story && userId) {
      fetch('/api/stories/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.storyId, userId, action: 'view' }),
      });
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      const userStories = Array.from(storyGroupsRef.current.values())[currentUserIndex - 1];
      setCurrentStoryIndex(userStories.length - 1);
    }
  };

  const handleLike = async (storyId: string) => {
    if (!userId) return;

    try {
      const res = await fetch('/api/stories/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, userId, action: 'like' }),
      });

      const data = await res.json();
      if (data.success) {
        setStories(stories.map(s =>
          s.storyId === storyId
            ? { ...s, likes: data.isLiked ? [...s.likes, userId] : s.likes.filter(id => id !== userId) }
            : s
        ));
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi like story');
    }
  };

  const handleCreateStory = () => {
    // Tạo story từ achievement
    if (!userId) return;

    // Tạm thời tạo achievement story
    fetch('/api/stories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: 'achievement',
        content: 'Tôi đã chia sẻ thành tích sống xanh! 🌱',
        achievementType: 'cup_saved',
        achievementData: { count: 1 },
      }),
    }).then(res => res.json()).then(data => {
      if (data.success) {
        toast.success('Đã tạo story!');
        loadStories();
      }
    });
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  // Group stories by user for display
  const storyGroups = Array.from(storyGroupsRef.current.entries());
  const currentUserStories = storyGroups[currentUserIndex]?.[1] || [];
  const currentStory = currentUserStories[currentStoryIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="bg-dark-800/50 backdrop-blur-md sticky top-0 z-40 border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-primary-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary-400" />
            <h1 className="text-xl font-bold text-white">Stories</h1>
          </div>
          <button
            onClick={handleCreateStory}
            className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-white py-12">Đang tải...</div>
        ) : stories.length === 0 ? (
          <div className="text-center text-white py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary-400" />
            <p className="text-xl mb-4">Chưa có stories nào</p>
            <button
              onClick={handleCreateStory}
              className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
            >
              Tạo story đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {storyGroups.map(([userId, userStories], index) => (
              <motion.div
                key={userId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  setCurrentUserIndex(index);
                  setCurrentStoryIndex(0);
                  openStoryViewer(index);
                }}
                className="relative cursor-pointer group"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-full p-0.5">
                    <div className="w-full h-full bg-dark-800 rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {userStories[0]?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </div>
                  </div>
                  {userStories.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {userStories.length}
                    </span>
                  )}
                </div>
                <p className="text-center text-white text-sm mt-2 truncate">
                  {userStories[0]?.displayName || 'Người dùng'}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Story Viewer */}
      <AnimatePresence>
        {showStoryViewer && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            {/* Story Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              {currentStory.type === 'achievement' ? (
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-12 text-white text-center max-w-md">
                  <div className="text-6xl mb-4">{currentStory.achievementData?.displayText || '🎉'}</div>
                  <p className="text-2xl font-bold mb-4">{currentStory.content}</p>
                  <p className="text-primary-100">Chia sẻ thành tích sống xanh của bạn!</p>
                </div>
              ) : currentStory.type === 'image' ? (
                <Image
                  src={currentStory.content}
                  alt="Story"
                  width={800}
                  height={1200}
                  className="max-w-full max-h-full object-contain"
                  unoptimized
                />
              ) : (
                <div className="text-white text-center">
                  <p className="text-xl">{currentStory.content}</p>
                </div>
              )}

              {/* Navigation */}
              <button
                onClick={prevStory}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextStory}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Close */}
              <button
                onClick={() => setShowStoryViewer(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Story Info */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    {currentStory.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{currentStory.displayName || 'Người dùng'}</p>
                    <p className="text-white/70 text-sm">
                      {new Date(currentStory.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(currentStory.storyId)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm transition ${currentStory.likes.includes(userId || '')
                      ? 'bg-red-500/80 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${currentStory.likes.includes(userId || '') ? 'fill-current' : ''}`} />
                    <span>{currentStory.likes.length}</span>
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white">
                    <Eye className="w-5 h-5" />
                    <span>{currentStory.views.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

