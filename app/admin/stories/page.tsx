'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStoriesPage() {
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchPendingStories();
    }, []);

    const fetchPendingStories = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending stories:', error);
            toast.error('Lỗi tải tin chờ duyệt');
        } else {
            setStories(data || []);
        }
        setLoading(false);
    };

    const handleApprove = async (storyId: string) => {
        const { error } = await supabase
            .from('stories')
            .update({ status: 'active' })
            .eq('story_id', storyId);

        if (error) {
            toast.error('Duyệt thất bại');
        } else {
            toast.success('Đã duyệt tin');
            setStories(prev => prev.filter(s => s.story_id !== storyId));
        }
    };

    const handleReject = async (storyId: string) => {
        const { error } = await supabase
            .from('stories')
            .update({ status: 'archived' }) // Or delete
            .eq('story_id', storyId);

        if (error) {
            toast.error('Từ chối thất bại');
        } else {
            toast.success('Đã từ chối tin');
            setStories(prev => prev.filter(s => s.story_id !== storyId));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-yellow-500" />
                Duyệt Tin (Stories)
            </h1>

            {loading ? (
                <div>Đang tải...</div>
            ) : stories.length === 0 ? (
                <div className="text-gray-500">Không có tin nào cần duyệt.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stories.map(story => (
                        <div key={story.story_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex gap-4">
                            <div className="w-24 h-40 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                {story.type === 'image' || story.thumbnail ? (
                                    <img src={story.thumbnail || story.content} className="w-full h-full object-cover" alt="Story" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-center p-2">
                                        {story.content}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={story.avatar || 'https://via.placeholder.com/32'} className="w-6 h-6 rounded-full" />
                                        <span className="font-medium text-sm">{story.display_name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {new Date(story.created_at).toLocaleString()}
                                    </p>
                                    <div className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded inline-block">
                                        Chờ duyệt
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleApprove(story.story_id)}
                                        className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                    >
                                        <Check className="w-4 h-4" /> Duyệt
                                    </button>
                                    <button
                                        onClick={() => handleReject(story.story_id)}
                                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                    >
                                        <X className="w-4 h-4" /> Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
