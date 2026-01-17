import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, MapPin, Smile, Send, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import NextImage from 'next/image';
import BorrowedCups from '@/components/BorrowedCups';
import UserAvatar from '@/components/ui/UserAvatar';


export default function Feed({ user }: { user: any }) {
    const [postText, setPostText] = useState('');
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [image, setImage] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [emotion, setEmotion] = useState<string | null>(null);
    const [showEmotions, setShowEmotions] = useState(false);

    // Stories state
    const [stories, setStories] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const storyInputRef = useRef<HTMLInputElement>(null);

    const emotions = [
        { label: 'Vui vẻ', icon: '😄' },
        { label: 'Hào hứng', icon: '🤩' },
        { label: 'Thư giãn', icon: '😌' },
        { label: 'Biết ơn', icon: '🥰' },
        { label: 'Tự hào', icon: '😎' },
        { label: 'Buồn', icon: '😔' },
        { label: 'Mệt mỏi', icon: '😪' },
        { label: 'Giận dữ', icon: '😡' },
    ];

    const fetchStories = useCallback(async () => {
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching stories:', error);
        }
        if (data) setStories(data);
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('green_feed_posts')
                .select(`
                    *,
                    is_liked: post_likes!left(user_id)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const formattedPosts = data.map((post: any) => ({
                ...post,
                is_liked: post.is_liked && post.is_liked.length > 0
            }));

            setPosts(formattedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCreateStoryClick = () => {
        storyInputRef.current?.click();
    };

    const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ảnh/Video quá lớn (tối đa 5MB)');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Content = reader.result as string;

            try {
                const { error } = await supabase.from('stories').insert({
                    user_id: user.id,
                    type: 'image',
                    content: base64Content,
                    thumbnail: base64Content,
                    display_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Người dùng',
                    avatar: user?.user_metadata?.avatar_url,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                });

                if (error) throw error;
                toast.success('Đã gửi tin! Vui lòng chờ duyệt.');
                fetchStories();
            } catch (err: any) {
                console.error('Story upload error:', err);
                toast.error('Lỗi khi đăng tin: ' + (err.message || 'Lỗi không xác định'));
            }
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        fetchPosts();
        fetchStories();

        // Realtime subscription
        const channel = supabase
            .channel('public:green_feed_posts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'green_feed_posts' }, (payload: any) => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts, fetchStories]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Ảnh quá lớn (tối đa 5MB)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCheckinClick = () => {
        const services = ['Starbucks - Vincom', 'Highlands - Nhà Thờ', 'The Coffee House - Bà Triệu', 'Công viên Thống Nhất', 'SipMart Hub'];
        const loc = window.prompt('Nhập địa điểm check-in (hoặc chọn OK để lấy ngẫu nhiên):', services[Math.floor(Math.random() * services.length)]);
        if (loc) setLocation(loc);
    };

    const handleEmotionClick = () => {
        setShowEmotions(!showEmotions);
    };

    const selectEmotion = (emo: string) => {
        setEmotion(emo);
        setShowEmotions(false);
    };

    const handlePost = async () => {
        if (!postText.trim() && !image) return;

        try {
            const { error } = await supabase.from('green_feed_posts').insert({
                user_id: user.id,
                content: postText,
                display_name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Người dùng',
                avatar: user?.avatar || user?.user_metadata?.avatar_url,
                image_url: image,
                location: location,
                emotion: emotion,
                carbon_saved: 0
            });

            if (error) throw error;

            setPostText('');
            setImage(null);
            setLocation(null);
            setEmotion(null);
            toast.success('Đã đăng bài viết mới! 🌱');
        } catch (error: any) {
            console.error('Post error details:', error);
            toast.error(`Không thể đăng bài: ${error.message || error.details || 'Lỗi không xác định'}`);
        }
    };

    const handleLike = async (postId: string, currentLikeStatus: boolean) => {
        // Optimistic UI update
        setPosts((prev: any[]) => prev.map((p: any) =>
            p.post_id === postId
                ? { ...p, likes: (p.likes || 0) + (currentLikeStatus ? -1 : 1), is_liked: !currentLikeStatus }
                : p
        ));

        try {
            const { error } = await supabase.rpc('toggle_post_like', { p_post_id: postId });
            if (error) throw error;
        } catch (error) {
            console.error('Like error:', error);
            fetchPosts();
        }
    };

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={storyInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleStoryFileChange}
            />

            {/* Stories Section - Instagram Style Premium */}
            <div className="relative">
                {/* Gradient fade edges */}
                <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex gap-3 overflow-x-auto pb-4 pt-2 scrollbar-hide px-2"
                >
                    {/* Create Story Card - Premium */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateStoryClick}
                        className="flex-shrink-0 w-[120px] h-[200px] rounded-2xl overflow-hidden cursor-pointer shadow-lg shadow-green-500/10 relative group bg-gradient-to-br from-white to-gray-50 border border-gray-100"
                    >
                        {/* User avatar section */}
                        <div className="h-[60%] w-full relative overflow-hidden bg-gray-100">
                            <UserAvatar
                                user={user}
                                className="w-full h-full"
                                size={120}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                        </div>

                        {/* Create button section */}
                        <div className="h-[40%] w-full bg-white relative flex flex-col items-center justify-end pb-3">
                            <motion.div
                                className="absolute -top-5 w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center border-4 border-white text-white shadow-lg shadow-green-500/40 z-10"
                                whileHover={{ scale: 1.1 }}
                            >
                                <span className="text-xl font-bold">+</span>
                            </motion.div>
                            <span className="text-sm font-bold text-gray-800 mt-2">Tạo tin</span>
                            <span className="text-[10px] text-gray-500">Chia sẻ ngay</span>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-teal-500/0 group-hover:from-green-500/5 group-hover:to-teal-500/5 transition-all duration-500" />
                    </motion.div>

                    {/* Friends Stories */}
                    {stories.map((story: any, index: number) => (
                        <motion.div
                            key={story.story_id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-shrink-0 w-[120px] h-[200px] rounded-2xl overflow-hidden cursor-pointer shadow-lg shadow-gray-200/50 relative group"
                        >
                            {/* Story image */}
                            <NextImage
                                src={story.thumbnail || story.content || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.userName || 'Story')}&background=4ade80`}
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                alt="Story"
                                fill
                                sizes="(max-width: 768px) 100px, 120px"
                                unoptimized
                            />

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

                            {/* Avatar with animated ring */}
                            <div className="absolute top-3 left-3">
                                <div className="relative">
                                    {/* Animated gradient ring */}
                                    <motion.div
                                        className="absolute -inset-1 bg-gradient-to-tr from-green-400 via-teal-500 to-cyan-400 rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="relative w-9 h-9 border-2 border-white rounded-full bg-white">
                                        <UserAvatar
                                            src={story.avatar || story.avatar_url}
                                            name={story.display_name}
                                            className="w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Story name */}
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <span className="text-sm font-bold text-white truncate block drop-shadow-lg">
                                    {story.display_name}
                                </span>
                                <span className="text-[10px] text-white/80">
                                    {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Hover shine effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full" style={{ transition: 'transform 0.7s ease' }} />
                        </motion.div>
                    ))}

                    {/* Empty state placeholder if no stories */}
                    {stories.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center text-gray-400 text-sm px-8 py-4"
                        >
                            <span>Chưa có tin mới từ bạn bè</span>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Borrowed Cups Widget - Show Active Borrowed Cups */}
            <BorrowedCups />

            {/* Post Creation */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex gap-3 mb-3">
                    <UserAvatar
                        user={user}
                        className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                        <div className="bg-gray-50 rounded-2xl px-4 py-2 hover:bg-gray-100 transition-colors cursor-text relative group mb-2">
                            <input
                                type="text"
                                placeholder="Bạn đang nghĩ gì về môi trường hôm nay?"
                                className="w-full bg-transparent border-none outline-none text-sm py-2"
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                            />
                        </div>

                        {/* Previews */}
                        {(image || location || emotion) && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {location && (
                                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {location}
                                        <button onClick={() => setLocation(null)} className="ml-1 hover:text-red-800">×</button>
                                    </span>
                                )}
                                {emotion && (
                                    <span className="bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                                        <Smile className="w-3 h-3" /> {emotion}
                                        <button onClick={() => setEmotion(null)} className="ml-1 hover:text-yellow-800">×</button>
                                    </span>
                                )}
                            </div>
                        )}
                        {image && (
                            <div className="relative w-full max-h-60 overflow-hidden rounded-lg mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image} className="w-full h-full object-cover" alt="Preview" />
                                <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70">×</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Emotion Picker */}
                {showEmotions && (
                    <div className="flex gap-2 mb-3 px-2 overflow-x-auto py-2 scrollbar-hide">
                        {emotions.map((e, idx) => (
                            <button key={idx} onClick={() => selectEmotion(e.label)} className="bg-yellow-50 hover:bg-yellow-100 border border-yellow-100 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex items-center gap-1 shadow-sm">
                                <span>{e.icon}</span> <span className="font-medium text-gray-700">{e.label}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex gap-1">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <button onClick={handleImageClick} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors">
                            <ImageIcon className="w-5 h-5 text-green-500" />
                            <span>Ảnh/Video</span>
                        </button>
                        <button onClick={handleCheckinClick} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors">
                            <MapPin className="w-5 h-5 text-red-500" />
                            <span>Check-in</span>
                        </button>
                        <button onClick={handleEmotionClick} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors">
                            <Smile className="w-5 h-5 text-yellow-500" />
                            <span>Cảm xúc</span>
                        </button>
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={!postText.trim() && !image}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Đăng <Send className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
                {loading && <div className="text-center py-4 text-gray-500">Đang tải tin...</div>}

                {!loading && posts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ! 🌱
                    </div>
                )}

                {posts.map((post: any) => (
                    <motion.div
                        key={post.post_id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        {/* Post Header */}
                        <div className="p-4 flex justify-between items-start">
                            <div className="flex gap-3">
                                <UserAvatar
                                    src={post.avatar}
                                    name={post.display_name}
                                    className="w-10 h-10 border border-gray-100"
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center flex-wrap gap-1">
                                        {post.display_name}
                                        {post.emotion && (
                                            <span className="font-normal text-gray-500 text-sm">
                                                đang cảm thấy <span className="text-yellow-600 font-medium">{post.emotion}</span>
                                            </span>
                                        )}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                                        {post.location && (
                                            <span className="flex items-center gap-0.5 text-red-500">
                                                • <MapPin className="w-3 h-3" /> {post.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Post Content */}
                        <div className="px-4 pb-3">
                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {post.image_url && (
                            <div className="w-full relative">
                                <NextImage
                                    src={post.image_url}
                                    alt="Post content"
                                    width={600}
                                    height={400}
                                    className="w-full h-auto object-cover max-h-[500px]"
                                />
                            </div>
                        )}

                        {/* Post Stats */}
                        <div className="px-4 py-3 flex items-center justify-between text-xs text-gray-500 border-b border-gray-50">
                            <div className="flex items-center gap-1">
                                <div className="flex -space-x-1">
                                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[8px] text-white">🍃</div>
                                </div>
                                <span>{post.likes || 0} người</span>
                            </div>
                            <div className="flex gap-3">
                                <span>0 bình luận</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-2 py-1 flex items-center justify-between">
                            <button
                                onClick={() => handleLike(post.post_id, post.is_liked)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm ${post.is_liked ? 'text-green-600' : 'text-gray-600'}`}
                            >
                                <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                                <span>Thả lá</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 font-medium text-sm">
                                <MessageCircle className="w-5 h-5" />
                                <span>Bình luận</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 font-medium text-sm">
                                <Share2 className="w-5 h-5" />
                                <span>Chia sẻ</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
