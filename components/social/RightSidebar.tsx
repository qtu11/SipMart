import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface RightSidebarProps {
    onChatSelect?: (contact: any) => void;
}

export default function RightSidebar({ onChatSelect }: RightSidebarProps) {
    const [contacts, setContacts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const fetchContacts = useCallback(async () => {
        if (!searchTerm.trim()) {
            const { data: userData } = await supabase.auth.getUser();
            const { data } = await supabase
                .from('users')
                .select('user_id, display_name, avatar, rank_level')
                .neq('user_id', userData.user?.id) // Exclude self
                .limit(10);

            if (data) mapContacts(data);
            return;
        }

        const { data, error } = await supabase
            .rpc('search_users', { search_term: searchTerm });

        if (error) {
            console.error('Search error:', error);
        } else if (data) {
            mapContacts(data);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const mapContacts = (data: any[]) => {
        const mapped = data.map(u => ({
            id: u.user_id,
            name: u.display_name || 'Người dùng',
            avatar: u.avatar || `https://ui-avatars.com/api/?name=${u.display_name || 'User'}`,
            status: 'online'
        }));
        setContacts(mapped);
    };

    const filteredContacts = contacts;

    return (
        <div className="space-y-6">
            {/* Contacts List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider">Người liên hệ</h3>
                    <Search className="w-4 h-4 text-gray-400 cursor-pointer" />
                </div>

                {/* Search Input for Contacts */}
                <div className="mb-3">
                    <input
                        type="text"
                        placeholder="Tìm người liên hệ..."
                        className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <ul className="space-y-2">
                    {filteredContacts.map((contact) => (
                        <li
                            key={contact.id}
                            onClick={() => onChatSelect && onChatSelect(contact)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors group"
                        >
                            <div className="relative">
                                <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm group-hover:text-green-700 transition-colors">{contact.name}</h4>
                                <span className="text-xs text-green-500 flex items-center gap-1">
                                    Đang hoạt động
                                </span>
                            </div>
                        </li>
                    ))}
                    {filteredContacts.length === 0 && (
                        <li className="text-center text-gray-400 text-xs py-2">Không tìm thấy người liên hệ</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
