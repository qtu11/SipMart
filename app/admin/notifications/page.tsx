'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, Send, Trash2, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '@/lib/supabase/authFetch';
import RichTextEditor from '@/components/RichTextEditor';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface Notification {
    notification_id: string;
    type: string;
    title: string;
    message: string;
    content_html: string | null;
    emoji: string | null;
    recipients_count: number;
    read_count: number;
    created_at: string;
}

interface Template {
    template_id: string;
    name: string;
    content_html: string;
    emoji: string | null;
    category: string;
}

export default function AdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'templates'>('list');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'list') fetchNotifications();
        if (activeTab === 'templates') fetchTemplates();
    }, [activeTab]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await authFetch('/api/admin/notifications');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (error) {
            toast.error('Không thể tải danh sách thông báo');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await authFetch('/api/admin/notifications/templates');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setTemplates(data.templates || []);
        } catch (error) {
            toast.error('Không thể tải template');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (notificationId: string) => {
        if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;

        try {
            const res = await authFetch(`/api/admin/notifications/${notificationId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('Đã xóa thông báo');
            fetchNotifications();
        } catch (error) {
            toast.error('Xóa thất bại');
        }
    };

    return (
        <div className="min-h-screen bg-dark-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-600 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Quản lý Thông báo</h1>
                            <p className="text-dark-600">Gửi thông báo với rich text editor</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-soft mb-6">
                    <div className="border-b border-dark-200 flex">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-6 py-3 font-medium ${activeTab === 'list'
                                ? 'border-b-2 border-primary-500 text-primary-600'
                                : 'text-dark-600 hover:text-dark-900'
                                }`}
                        >
                            Danh sách
                        </button>
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`px-6 py-3 font-medium ${activeTab === 'create'
                                ? 'border-b-2 border-primary-500 text-primary-600'
                                : 'text-dark-600 hover:text-dark-900'
                                }`}
                        >
                            Soạn thông báo mới
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`px-6 py-3 font-medium ${activeTab === 'templates'
                                ? 'border-b-2 border-primary-500 text-primary-600'
                                : 'text-dark-600 hover:text-dark-900'
                                }`}
                        >
                            Templates
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'list' && (
                            <NotificationList
                                notifications={notifications}
                                loading={loading}
                                onDelete={handleDelete}
                            />
                        )}
                        {activeTab === 'create' && (
                            <CreateNotification
                                templates={templates}
                                onSuccess={() => {
                                    setActiveTab('list');
                                    fetchNotifications();
                                }}
                            />
                        )}
                        {activeTab === 'templates' && (
                            <TemplateList templates={templates} loading={loading} onSuccess={fetchTemplates} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Notification List Component
function NotificationList({
    notifications,
    loading,
    onDelete
}: {
    notifications: Notification[];
    loading: boolean;
    onDelete: (id: string) => void;
}) {
    if (loading) return <div className="text-center py-8 text-dark-600">Đang tải...</div>;
    if (notifications.length === 0)
        return <div className="text-center py-8 text-dark-600">Chưa có thông báo nào</div>;

    return (
        <div className="space-y-4">
            {notifications.map((notif) => (
                <div key={notif.notification_id} className="border border-dark-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {notif.emoji && <span className="text-2xl">{notif.emoji}</span>}
                                <h3 className="font-semibold text-dark-900">{notif.title}</h3>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${notif.type === 'promotion'
                                        ? 'bg-green-100 text-green-700'
                                        : notif.type === 'warning'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}
                                >
                                    {notif.type}
                                </span>
                            </div>
                            {notif.content_html ? (
                                <div
                                    className="text-sm text-dark-600 prose prose-sm max-w-none line-clamp-2"
                                    dangerouslySetInnerHTML={{ __html: notif.content_html }}
                                />
                            ) : (
                                <p className="text-sm text-dark-600 line-clamp-2">{notif.message}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                                <span>👥 {notif.recipients_count} người nhận</span>
                                <span>👀 {notif.read_count} đã đọc</span>
                                <span>📅 {new Date(notif.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onDelete(notif.notification_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Create Notification Component
function CreateNotification({
    templates,
    onSuccess
}: {
    templates: Template[];
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        type: 'info',
        title: '',
        message: '',
        content_html: '',
        emoji: '',
        target_audience: 'all',
        target_rank: '',
        priority: 0
    });
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleLoadTemplate = (template: Template) => {
        setFormData({
            ...formData,
            content_html: template.content_html,
            emoji: template.emoji || ''
        });
        toast.success('Đã tải template');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || (!formData.message && !formData.content_html)) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setSending(true);
        try {
            const res = await authFetch('/api/admin/notifications', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    target_rank: formData.target_rank || null
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed');
            }

            const data = await res.json();
            toast.success(`Đã gửi thông báo đến ${data.notification.recipients_count} người!`);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Gửi thất bại');
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selector */}
            {templates.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                        Sử dụng Template
                    </label>
                    <div className="flex gap-2 flex-wrap">
                        {templates.map((tmpl) => (
                            <button
                                key={tmpl.template_id}
                                type="button"
                                onClick={() => handleLoadTemplate(tmpl)}
                                className="px-3 py-1 text-sm border border-dark-200 rounded-lg hover:bg-primary-50 hover:border-primary-300"
                            >
                                {tmpl.emoji} {tmpl.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                        Loại thông báo <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                    >
                        <option value="info">Thông tin</option>
                        <option value="warning">Cảnh báo</option>
                        <option value="promotion">Khuyến mãi</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="event">Sự kiện</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                        Emoji
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.emoji}
                            onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                            className="w-full px-3 py-2 border border-dark-200 rounded-lg pr-10"
                            placeholder="Chọn emoji..."
                        />
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl"
                        >
                            😊
                        </button>
                        {showEmojiPicker && (
                            <div className="absolute top-full right-0 mt-1 z-10">
                                <EmojiPicker
                                    onEmojiClick={(emoji) => {
                                        setFormData({ ...formData, emoji: emoji.emoji });
                                        setShowEmojiPicker(false);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                    placeholder="Tiêu đề thông báo..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">
                    Nội dung (Rich Text) <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                    value={formData.content_html}
                    onChange={(html) => setFormData({ ...formData, content_html: html })}
                    placeholder="Soạn nội dung thông báo..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                        Đối tượng nhận
                    </label>
                    <select
                        value={formData.target_audience}
                        onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                        className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                    >
                        <option value="all">Tất cả người dùng</option>
                        <option value="active">Người dùng hoạt động</option>
                        <option value="inactive">Người dùng không hoạt động</option>
                        <option value="new">Người dùng mới</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-dark-700 mb-1">
                        Rank cụ thể
                    </label>
                    <select
                        value={formData.target_rank}
                        onChange={(e) => setFormData({ ...formData, target_rank: e.target.value })}
                        className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                    >
                        <option value="">Tất cả</option>
                        <option value="seed">Seed</option>
                        <option value="sprout">Sprout</option>
                        <option value="sapling">Sapling</option>
                        <option value="tree">Tree</option>
                        <option value="forest">Forest</option>
                    </select>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50"
                >
                    <Eye className="w-4 h-4" />
                    Preview
                </button>
                <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 ml-auto"
                >
                    <Send className="w-4 h-4" />
                    {sending ? 'Đang gửi...' : 'Gửi Broadcast'}
                </button>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Preview</h3>
                        <div className="border border-dark-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                {formData.emoji && <span className="text-2xl">{formData.emoji}</span>}
                                <h4 className="font-semibold text-dark-900">{formData.title || '[No title]'}</h4>
                            </div>
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: formData.content_html || '<p class="text-dark-400">[No content]</p>'
                                }}
                            />
                        </div>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="mt-4 px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 w-full"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}

// Template List Component
function TemplateList({
    templates,
    loading,
    onSuccess
}: {
    templates: Template[];
    loading: boolean;
    onSuccess: () => void;
}) {
    if (loading) return <div className="text-center py-8 text-dark-600">Đang tải...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-dark-900">Templates có sẵn</h3>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-8 text-dark-600">Chưa có template nào</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tmpl) => (
                        <div key={tmpl.template_id} className="border border-dark-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                {tmpl.emoji && <span className="text-2xl">{tmpl.emoji}</span>}
                                <h4 className="font-semibold text-dark-900">{tmpl.name}</h4>
                            </div>
                            <div
                                className="prose prose-sm max-w-none line-clamp-3 text-dark-600"
                                dangerouslySetInnerHTML={{ __html: tmpl.content_html }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
