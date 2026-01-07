import React from 'react';
import Link from 'next/link';
import { Map, Wallet, TreeDeciduous, Trophy, Calendar, ScanLine } from 'lucide-react';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => (
    <Link href={href}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active
            ? 'bg-green-50 text-green-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            }`}>
            <div className={`${active ? 'text-green-600' : 'text-gray-500'}`}>
                {icon}
            </div>
            <span>{label}</span>
        </div>
    </Link>
);

export default function LeftSidebar({ user }: { user: any }) {
    return (
        <div className="space-y-6">
            {/* Short Profile Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <img
                        src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border-2 border-green-100"
                    />
                    <div>
                        <h3 className="font-bold text-gray-800">{user?.name || 'Sinh viên'}</h3>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-100">
                            🌱 Sprout Rank
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-800">12</div>
                        <div className="text-xs text-gray-500">Ly đã cứu</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-800">158</div>
                        <div className="text-xs text-gray-500">Điểm xanh</div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
                <SidebarItem icon={<ScanLine className="w-5 h-5" />} label="Quét QR" href="/scan" />
                <SidebarItem icon={<Map className="w-5 h-5" />} label="Bản đồ Eco" href="/map" />
                <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Ví điện tử" href="/wallet" />
                <SidebarItem icon={<TreeDeciduous className="w-5 h-5" />} label="Vườn cây ảo" href="/garden" />
                <SidebarItem icon={<Trophy className="w-5 h-5" />} label="Thử thách" href="/challenges" />
                <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Sự kiện" href="/events" />
            </nav>

            {/* Mini Challenge Widget */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded block">Thử thách ngày</span>
                        <Trophy className="w-4 h-4 text-yellow-300" />
                    </div>
                    <h4 className="font-bold mb-1">Mượn ly không nhựa</h4>
                    <p className="text-xs opacity-90 mb-3">Hoàn thành để nhận +50 điểm</p>
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-white w-2/3 h-full rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
