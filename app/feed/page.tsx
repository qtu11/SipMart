'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Camera, Plus, Image as ImageIcon, X, Send } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { logger } from '@/lib/logger';
import LoadingSpinner from '@/components/LoadingSpinner';
import FallingLeaves from '@/components/FallingLeaves';

interface FeedPost {
  postId: string;
  userId: string;
  displayName: string;
  avatar?: string;
  imageUrl: string;
  caption?: string;
  greenPointsEarned: number;
  likes: number;
  likedBy?: string[];
  comments: FeedComment[];
  createdAt: Date;
  liked?: boolean;
  postType?: 'normal' | 'achievement';
  achievementType?: string;
}

interface FeedComment {
  commentId: string;
  userId: string;
  displayName: string;
  avatar?: string;
  content: string;
  createdAt: Date;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [showComments, setShowComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/feed/posts');
      if (!response.ok) throw new Error('Failed to fetch feed');
      const data = await response.json();

      // Map posts và check liked status
      const mappedPosts = (data.posts || []).map((post: FeedPost) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        comments: (post.comments || []).map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })),
        liked: user ? (post.likedBy || []).includes(user.id || user.user_id) : false,
      }));

      setPosts(mappedPosts);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error fetching feed', { error });
      toast.error('Không thể tải feed');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const initFeed = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // fetchFeed will run via the effect below or we can call it here if we remove 'user' dep
      }

      const unsubscribe = onAuthChange((user) => {
        if (!user) {
          router.push('/auth/login');
          return;
        }
        setUser(user);
      });
      return () => unsubscribe();
    };
    initFeed();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchFeed();
    }
  }, [user, fetchFeed]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    setSelectedImage(file);
  };

  const handleUpload = async () => {
    if (!selectedImage || !user) {
      toast.error('Vui lòng chọn ảnh');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('userId', user.id || user.user_id);
      if (caption) formData.append('caption', caption);

      const response = await fetch('/api/feed/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      toast.success('Đăng bài thành công! +10 điểm');

      // Reset form
      setSelectedImage(null);
      setCaption('');
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh feed
      fetchFeed();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Upload error:', error);
      toast.error('Không thể đăng bài');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    try {
      const response = await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId: user.id || user.user_id }),
      });

      if (!response.ok) throw new Error('Like failed');

      const data = await response.json();

      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post.postId === postId
            ? {
              ...post,
              liked: data.isLiked,
              likes: data.isLiked ? post.likes + 1 : post.likes - 1,
              likedBy: data.isLiked
                ? [...(post.likedBy || []), user.id || user.user_id]
                : (post.likedBy || []).filter(id => id !== (user.id || user.user_id)),
            }
            : post
        )
      );
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Like error:', error);
      toast.error('Không thể like bài viết');
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !commentText[postId]?.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          userId: user.id || user.user_id,
          content: commentText[postId],
        }),
      });

      if (!response.ok) throw new Error('Comment failed');

      toast.success('Đã thêm bình luận');
      setCommentText({ ...commentText, [postId]: '' });

      // Refresh feed
      fetchFeed();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Comment error:', error);
      toast.error('Không thể thêm bình luận');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <FallingLeaves />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-dark-800">Green Feed</h1>
          <button
            onClick={() => setShowUpload(true)}
            className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition shadow-medium"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-500 mb-4">Chưa có bài đăng nào</p>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition"
            >
              Đăng ảnh đầu tiên
            </button>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.postId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden ${post.postType === 'achievement'
                ? 'border-4 border-yellow-400 ring-2 ring-yellow-200'
                : 'border-2 border-dark-100'
                }`}
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {post.avatar ? (
                    <Image
                      src={post.avatar}
                      alt={post.displayName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold">
                        {post.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-dark-800">{post.displayName}</p>
                    <p className="text-xs text-dark-400">
                      {post.createdAt.toLocaleString('vi-VN', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.postType === 'achievement' && (
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      🏆 Thành tựu
                    </span>
                  )}
                  <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                    +{post.greenPointsEarned} điểm
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="w-full aspect-square relative bg-dark-100">
                <Image
                  src={post.imageUrl}
                  alt={post.caption || 'Feed image'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>

              {/* Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.postId)}
                    className={`flex items-center gap-2 ${post.liked ? 'text-red-500' : 'text-dark-400'
                      } hover:text-red-500 transition`}
                  >
                    <Heart className={`w-6 h-6 ${post.liked ? 'fill-current' : ''}`} />
                    <span className="font-semibold">{post.likes}</span>
                  </button>
                  <button
                    onClick={() => setShowComments(showComments === post.postId ? null : post.postId)}
                    className="flex items-center gap-2 text-dark-400 hover:text-primary-600 transition"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-semibold">{post.comments.length}</span>
                  </button>
                  <button className="flex items-center gap-2 text-dark-400 hover:text-primary-600 transition ml-auto">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>

                {post.caption && (
                  <p className="text-dark-700">
                    <span className="font-semibold">{post.displayName}</span>{' '}
                    {post.caption}
                  </p>
                )}

                {/* Comments Section */}
                {showComments === post.postId && (
                  <div className="pt-3 border-t border-dark-100 space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.commentId} className="flex gap-2">
                        {comment.avatar ? (
                          <Image
                            src={comment.avatar}
                            alt={comment.displayName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 text-xs font-bold">
                              {comment.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-semibold text-dark-800">{comment.displayName}</span>{' '}
                            <span className="text-dark-600">{comment.content}</span>
                          </p>
                          <p className="text-xs text-dark-400 mt-1">
                            {comment.createdAt.toLocaleString('vi-VN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add Comment */}
                    {user && (
                      <div className="flex gap-2 pt-2">
                        {user.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt={user.displayName || 'You'}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 text-xs font-bold">
                              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Thêm bình luận..."
                            value={commentText[post.postId] || ''}
                            onChange={(e) => setCommentText({ ...commentText, [post.postId]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.postId);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-dark-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.postId)}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </main>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-dark-800">Đăng ảnh</h2>
              <button
                onClick={() => {
                  setShowUpload(false);
                  setSelectedImage(null);
                  setCaption('');
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-dark-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedImage ? (
              <div className="space-y-4">
                <div className="w-full aspect-square relative bg-dark-100 rounded-xl overflow-hidden">
                  <Image
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <textarea
                  placeholder="Thêm chú thích..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-3 border border-dark-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="flex-1 px-4 py-3 border border-dark-200 rounded-xl font-semibold hover:bg-dark-50 transition"
                  >
                    Chọn lại
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition disabled:opacity-50"
                  >
                    {uploading ? 'Đang đăng...' : 'Đăng'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-dark-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition"
                >
                  <Camera className="w-16 h-16 text-dark-400 mb-4" />
                  <p className="text-dark-600 font-semibold">Chọn ảnh để đăng</p>
                  <p className="text-sm text-dark-400 mt-1">JPG, PNG tối đa 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
