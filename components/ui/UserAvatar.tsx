'use client';

import React from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';

interface UserAvatarProps {
    user?: any; // Có thể là object user từ supabase hoặc object user từ db
    src?: string | null;
    name?: string | null;
    className?: string;
    size?: number;
    showRankEmoji?: boolean;
}

export default function UserAvatar({
    user,
    src,
    name,
    className = "w-10 h-10",
    size = 40,
    showRankEmoji = false
}: UserAvatarProps) {
    // Ưu tiên src truyền vào trực tiếp
    // Nếu không có, tìm trong user object theo thứ tự ưu tiên
    let avatarSrc = src ||
        user?.avatar ||
        user?.avatar_url ||
        user?.user_metadata?.avatar_url;

    // Check if avatarSrc is a ui-avatars URL (legacy or inconsistent color)
    // If it is, and we want to enforce OUR style, we should ignore it and let the fallback logic take over
    if (avatarSrc && typeof avatarSrc === 'string' && avatarSrc.includes('ui-avatars.com')) {
        avatarSrc = null;
    }

    // Tên hiển thị để tạo fallback avatar
    const displayName = name ||
        user?.displayName ||
        user?.display_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        'User';

    // Fallback URL từ ui-avatars.com
    const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=22c55e&color=fff&size=128`;

    // Rank emoji logic (nếu cần hiển thị ngay trên avatar)
    const rankEmojis: Record<string, string> = {
        seed: '🌱',
        sprout: '🌿',
        sapling: '🌳',
        tree: '🌲',
        forest: '🌍',
    };

    const rankLevel = user?.rankLevel || user?.rank_level || 'seed';
    const rankEmoji = rankEmojis[rankLevel] || '🌱';

    return (
        <div className={`relative inline-block ${className}`}>
            <div className={`relative overflow-hidden rounded-full bg-gray-100 w-full h-full border border-gray-200`}>
                <Image
                    src={avatarSrc || fallbackSrc}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized // Bỏ qua tối ưu hóa ảnh để tránh lỗi với URL ngoài
                    onError={(e) => {
                        // Fallback nếu ảnh lỗi (cần xử lý logic này ở parent hoặc dùng state nếu muốn advanced)
                        // Hiện tại next/image khá strict, ta dùng unoptimized để giảm thiểu lỗi
                        const target = e.target as HTMLImageElement;
                        target.src = fallbackSrc;
                    }}
                />
            </div>

            {showRankEmoji && (
                <div className="absolute -bottom-1 -right-1 w-[40%] h-[40%] min-w-[16px] min-h-[16px] bg-green-500 rounded-lg flex items-center justify-center border-2 border-white text-[10px] shadow-sm z-10">
                    {rankEmoji}
                </div>
            )}
        </div>
    );
}
