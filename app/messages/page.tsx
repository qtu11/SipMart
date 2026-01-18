'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    ArrowLeft, MessageSquare, Search, Send, Phone, Video, MoreHorizontal,
    Smile, Image as ImageIcon, Paperclip, X, User, Bell, BellOff,
    Trash2, ChevronDown, ChevronUp, AlertCircle, Check, Mic, MapPin,
    FileText, Edit3, Palette, Maximize2, Download
} from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

// Types
interface OtherUser {
    id: string;
    displayName: string;
    email?: string;
    avatar?: string;
}

interface LastMessage {
    content: string;
    created_at: string;
    sender_id?: string;
}

interface Conversation {
    conversation_id: string;
    otherUser: OtherUser;
    lastMessage?: LastMessage;
    unreadCount?: number;
    // Settings from database
    nickname?: string;
    themeColor?: string;
    bgColor?: string;
    isMuted?: boolean;
}

interface Message {
    message_id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: string;
    created_at: string;
    media_url?: string;
    metadata?: any;
}

// Theme colors
const THEME_COLORS = [
    { name: 'Xanh lá', color: '#10b981', icon: '🌿' },
    { name: 'Xanh dương', color: '#3b82f6', icon: '💙' },
    { name: 'Tím', color: '#8b5cf6', icon: '💜' },
    { name: 'Hồng', color: '#ec4899', icon: '💗' },
    { name: 'Cam', color: '#f97316', icon: '🧡' },
    { name: 'Đỏ', color: '#ef4444', icon: '❤️' },
    { name: 'Love', color: '#e91e63', icon: '💕' },
    { name: 'Valentine', color: '#ff1744', icon: '💘' },
];

// Background colors
const BG_COLORS = [
    { name: 'Mặc định', color: '#b8e6afff', dark: false, icon: '🌱' },
    { name: 'Xanh nhạt', color: '#ecfdf5', dark: false, icon: '🍃' },
    { name: 'Tím nhạt', color: '#f5f3ff', dark: false, icon: '💜' },
    { name: 'Hồng nhạt', color: '#fdf2f8', dark: false, icon: '🌸' },
    { name: 'Love Pink', color: '#fce4ec', dark: false, icon: '💕' },
    { name: 'Love Red', color: '#ffebee', dark: false, icon: '❤️' },
    { name: 'Tối', color: '#1f2937', dark: true, icon: '🌙' },
    { name: 'Đen', color: '#111827', dark: true, icon: '🖤' },
];

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams?.get('conversationId');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(false);

    // Feature states
    const [themeColor, setThemeColor] = useState('#10b981');
    const [bgColor, setBgColor] = useState('#f9fafb');
    const [isDarkBg, setIsDarkBg] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showBgPicker, setShowBgPicker] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [showMessageSearch, setShowMessageSearch] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<Message[]>([]);
    const [nickname, setNickname] = useState(''); // Biệt danh cho đối phương
    const [myNickname, setMyNickname] = useState(''); // Biệt danh cho mình
    const [showNicknameEdit, setShowNicknameEdit] = useState(false);
    const [showMyNicknameEdit, setShowMyNicknameEdit] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Call states
    const [showCallModal, setShowCallModal] = useState(false);
    const [callType, setCallType] = useState<'voice' | 'video'>('voice');
    const [callStartTime, setCallStartTime] = useState<Date | null>(null);
    const [isInCall, setIsInCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState<{
        from: string;
        fromName: string;
        fromAvatar: string;
        type: 'voice' | 'video';
        conversationId: string;
    } | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');

    // WebRTC refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null); // New state to trigger render
    const [previewImage, setPreviewImage] = useState<string | null>(null); // Image lightbox state

    // ICE servers configuration
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    // Video refs effect - ensure streams are attached when modal opens
    useEffect(() => {
        if (showCallModal) {
            if (localVideoRef.current && localStreamRef.current) {
                localVideoRef.current.srcObject = localStreamRef.current;
            }
            if (remoteVideoRef.current && (remoteStreamRef.current || remoteStreamState)) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current || remoteStreamState;
            }
        }
    }, [showCallModal, callStatus, remoteStreamState]); // Re-run when modal opens or call status changes

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        customize: true,
        media: false,
        privacy: false
    });

    // Toggle section
    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load conversations
    const loadConversations = useCallback(async () => {
        try {
            setError(null);
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) throw new Error('Chưa đăng nhập');

            const res = await fetch('/api/messaging/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Không thể tải tin nhắn');

            const data = await res.json();

            if (data.success) {
                setConversations(data.conversations || []);
                if (conversationIdParam && data.conversations) {
                    const conv = data.conversations.find(
                        (c: Conversation) => c.conversation_id === conversationIdParam
                    );
                    if (conv) setSelectedConversation(conv);
                }
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            setError(error instanceof Error ? error.message : 'Không thể tải tin nhắn');
        } finally {
            setLoading(false);
        }
    }, [conversationIdParam]);

    // Load messages
    const loadMessages = useCallback(async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setMessages(data?.reverse() || []);

            const media = (data || []).filter((m: Message) => m.type === 'image' && m.media_url);
            setMediaFiles(media);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, []);

    // Save conversation settings to database
    const saveSettings = useCallback(async (conversationId: string, settings: {
        nickname?: string;
        themeColor?: string;
        bgColor?: string;
        isMuted?: boolean;
    }) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            await fetch(`/api/messaging/conversations/${conversationId}/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(settings)
            });
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }, []);

    // Mark conversation as read
    const markAsRead = useCallback(async (conversationId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            await fetch(`/api/messaging/conversations/${conversationId}/settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, []);

    // Send message
    const handleSendMessage = async (content?: string, type: string = 'text') => {
        const messageContent = content || newMessage;
        if (!messageContent.trim() || !selectedConversation || !currentUserId) return;

        setSendingMessage(true);
        if (!content) setNewMessage('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await fetch('/api/messaging/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId: selectedConversation.conversation_id,
                    content: messageContent,
                    type
                })
            });

            if (!res.ok) throw new Error('Gửi thất bại');
            loadMessages(selectedConversation.conversation_id);
        } catch (error) {
            console.error('Error sending message:', error);
            if (!content) setNewMessage(messageContent);
            toast.error('Gửi tin nhắn thất bại');
        } finally {
            setSendingMessage(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversation) return;

        const loadingToast = toast.loading('Đang tải lên...');

        try {
            // Upload to Supabase Storage - Use 'chat-media' bucket
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            // Path MUST start with userId to satisfy RLS policy
            const filePath = `${currentUserId}/${selectedConversation.conversation_id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('chat-media')
                .getPublicUrl(filePath);

            // Determine message type - must match DB constraint: text, image, sticker, video, voucher, borrow_request, system
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            let messageType = 'text'; // default for files
            if (isImage) messageType = 'image';
            if (isVideo) messageType = 'video';

            const content = isImage ? publicUrl : (isVideo ? publicUrl : `📎 Tệp: ${file.name}`);

            // Send message with file
            const { data: { session } } = await supabase.auth.getSession();

            // Build metadata
            const metadata: any = {};
            if (!isImage && !isVideo) {
                metadata.type = 'file';
                metadata.file_name = file.name;
                metadata.file_url = publicUrl;
                metadata.file_type = file.type;
                metadata.file_size = file.size;
            }

            await fetch('/api/messaging/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    conversationId: selectedConversation.conversation_id,
                    content,
                    type: messageType,
                    mediaUrl: publicUrl, // Always send mediaUrl so it's saved in the column if allowed, or we use metadata
                    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
                })
            });

            toast.success('Đã gửi file', { id: loadingToast });
            loadMessages(selectedConversation.conversation_id);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Không thể tải lên file', { id: loadingToast });
        }

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowAttachMenu(false);
    };

    // Voice Recording Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Handle voice recording
    const handleVoiceRecord = async () => {
        if (!navigator.mediaDevices) {
            toast.error('Trình duyệt không hỗ trợ ghi âm');
            return;
        }

        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

                // Upload to Supabase
                const loadingToast = toast.loading('Đang gửi ghi âm...');
                try {
                    // Path MUST start with userId
                    const fileName = `${currentUserId}/${selectedConversation!.conversation_id}/voice_${Date.now()}.webm`;
                    const { data, error } = await supabase.storage
                        .from('chat-media')
                        .upload(fileName, audioFile);

                    if (error) throw error;

                    const { data: { publicUrl } } = supabase.storage
                        .from('chat-media')
                        .getPublicUrl(fileName);

                    // Send message with type 'voice' (assuming DB allows or we use text as fallback but let's try voice)
                    // If DB constraint fails, we might need to use 'text' and detect it. 
                    // Let's rely on 'voice' type logic in the renderer.
                    await handleSendMessage('🎤 Tin nhắn thoại', 'voice'); // Hope DB accepts 'voice'

                    // Update the last message with media_url manually since handleSendMessage might not support mediaUrl arg directly for text
                    // Actually handleSendMessage implementation above (lines 260...) doesn't take mediaUrl.
                    // We need to use the fetch directly like in handleFileUpload

                    // Wait, handleSendMessage (line 260) only takes content and type. 
                    // It DOES NOT take mediaUrl. 
                    // We should use the same logic as handleFileUpload.
                } catch (error) {
                    console.error('Upload voice error:', error);
                    toast.error('Gửi thất bại', { id: loadingToast });
                }
            };

            // Re-implementing the upload logic correctly below inside the onstop to use fetch directly 
            // because handleSendMessage is limited.
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
                const loadingToast = toast.loading('Đang gửi ghi âm...');

                try {
                    const fileName = `voice/${selectedConversation!.conversation_id}/${Date.now()}.webm`;
                    const { error: uploadError } = await supabase.storage
                        .from('uploads')
                        .upload(fileName, audioFile);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('uploads')
                        .getPublicUrl(fileName);

                    const { data: { session } } = await supabase.auth.getSession();
                    await fetch('/api/messaging/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`
                        },
                        body: JSON.stringify({
                            conversationId: selectedConversation!.conversation_id,
                            content: '🎤 Tin nhắn thoại',
                            type: 'text', // Fallback to text to satisfy DB constraint
                            mediaUrl: publicUrl,
                            metadata: {
                                type: 'voice',
                                media_url: publicUrl
                            }
                        })
                    });

                    toast.success('Đã gửi', { id: loadingToast });
                    loadMessages(selectedConversation!.conversation_id);
                } catch (error) {
                    console.error('Error sending voice:', error);
                    toast.error('Gửi thất bại', { id: loadingToast });
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast('Đang ghi âm... Nhấn lần nữa để gửi', { icon: '🎙️' });
        } catch (error) {
            console.error('Mic error:', error);
            toast.error('Không thể truy cập microphone');
        }
    };

    // Handle location sharing
    const handleShareLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Trình duyệt không hỗ trợ vị trí');
            return;
        }

        toast.loading('Đang lấy vị trí...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const locationUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;

                // Use 'location' type if possible, or text with detection
                // We'll try to use 'location' type to be cleaner
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    await fetch('/api/messaging/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`
                        },
                        body: JSON.stringify({
                            conversationId: selectedConversation!.conversation_id,
                            content: `📍 Vị trí của tôi: ${locationUrl}`,
                            type: 'text', // Fallback to text
                            metadata: {
                                type: 'location',
                                location_url: locationUrl
                            }
                        })
                    });

                    toast.dismiss();
                    toast.success('Đã gửi vị trí');
                    loadMessages(selectedConversation!.conversation_id);
                } catch (e) {
                    // Fallback to text if API fails?
                    handleSendMessage(`📍 Vị trí của tôi: ${locationUrl}`, 'text');
                }
            },
            (error) => {
                toast.dismiss();
                toast.error('Không thể lấy vị trí');
            }
        );
        setShowAttachMenu(false);
    };

    // Toggle mute
    const handleToggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        toast.success(newMuted ? 'Đã tắt thông báo' : 'Đã bật thông báo');

        // Save to database
        if (selectedConversation) {
            saveSettings(selectedConversation.conversation_id, { isMuted: newMuted });
        }
    };

    // Save nickname
    const handleSaveNickname = () => {
        if (selectedConversation) {
            saveSettings(selectedConversation.conversation_id, { nickname });
            toast.success(`Đã đặt biệt danh: ${nickname || selectedConversation.otherUser?.displayName}`);
        }
        setShowNicknameEdit(false);
    };

    // Delete conversation
    const handleDeleteConversation = async () => {
        if (!selectedConversation) return;

        try {
            await supabase
                .from('messages')
                .delete()
                .eq('conversation_id', selectedConversation.conversation_id);

            toast.success('Đã xóa đoạn chat');
            setShowDeleteConfirm(false);
            setSelectedConversation(null);
            setShowInfoPanel(false);
            loadConversations();
        } catch (error) {
            toast.error('Không thể xóa đoạn chat');
        }
    };

    // Initialize WebRTC
    const setupMedia = async (callType: 'voice' | 'video') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: callType === 'video',
                audio: true
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (error) {
            console.error('Error accessing media:', error);
            toast.error('Không thể truy cập microphone/camera');
            return null;
        }
    };

    const createPeerConnection = (conversationId: string) => {
        const pc = new RTCPeerConnection(rtcConfig);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                supabase.channel(`call:${conversationId}`).send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: { candidate: event.candidate, from: currentUserId }
                });
            }
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            remoteStreamRef.current = stream;
            setRemoteStreamState(stream); // Trigger re-render to attach video
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        return pc;
    };

    // End call
    const endCall = async () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        if (callStartTime && selectedConversation) {
            const duration = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationStr = minutes > 0 ? `${minutes} phút ${seconds} giây` : `${seconds} giây`;

            // Send call message
            const callIcon = callType === 'voice' ? '📞' : '📹';
            const content = `${callIcon} Cuộc gọi ${callType === 'voice' ? 'thoại' : 'video'} - ${durationStr}`;
            await handleSendMessage(content, 'system');

            // Notify other user that call ended
            const callChannel = supabase.channel(`call:${selectedConversation.conversation_id}`);
            await callChannel.subscribe();
            await callChannel.send({
                type: 'broadcast',
                event: 'call-ended',
                payload: { endedBy: currentUserId }
            });
        }

        setShowCallModal(false);
        setIsInCall(false);
        setCallStartTime(null);
        setCallDuration(0);
        setCallStatus('idle');
    };

    // Start call
    const startCall = async (type: 'voice' | 'video') => {
        const otherUser = selectedConversation?.otherUser;
        if (!selectedConversation || !currentUserId || !otherUser) return;

        setCallType(type);
        setShowCallModal(true);
        setCallStatus('calling');
        setCallDuration(0);

        try {
            const stream = await setupMedia(type);
            if (!stream) return;

            const pc = createPeerConnection(selectedConversation.conversation_id);
            peerConnectionRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Broadcast call to other user
            const callChannel = supabase.channel(`call:${selectedConversation.conversation_id}`);
            await callChannel.subscribe();

            await callChannel.send({
                type: 'broadcast',
                event: 'incoming-call',
                payload: {
                    from: currentUserId,
                    fromName: 'Bạn',
                    fromAvatar: '',
                    type: type,
                    conversationId: selectedConversation.conversation_id,
                    offer: offer
                }
            });
        } catch (error) {
            console.error('Error starting call:', error);
            toast.error('Có lỗi xảy ra khi bắt đầu cuộc gọi');
            endCall();
        }
    };

    // Accept incoming call
    const acceptCall = async () => {
        if (!incomingCall || !currentUserId) return;

        // Save info locally
        const callInfo = { ...incomingCall };
        setIncomingCall(null);

        setCallType(callInfo.type);
        setShowCallModal(true);
        setIsInCall(true);
        setCallStartTime(new Date());
        setCallStatus('connected');

        try {
            const stream = await setupMedia(callInfo.type);
            if (!stream) return;

            const pc = createPeerConnection(callInfo.conversationId);
            peerConnectionRef.current = pc;

            // Handle Offer
            if ((callInfo as any).offer) {
                const remoteDesc = new RTCSessionDescription((callInfo as any).offer);
                await pc.setRemoteDescription(remoteDesc);

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                // Send Answer
                const callChannel = supabase.channel(`call:${callInfo.conversationId}`);
                await callChannel.subscribe();
                await callChannel.send({
                    type: 'broadcast',
                    event: 'answer',
                    payload: { answer: answer, to: callInfo.from }
                });
            }

            // Notify caller that call was accepted
            const callChannel = supabase.channel(`call:${callInfo.conversationId}`);
            await callChannel.subscribe();
            await callChannel.send({
                type: 'broadcast',
                event: 'call-accepted',
                payload: { acceptedBy: currentUserId }
            });
        } catch (error) {
            console.error('Error accepting call:', error);
            endCall();
        }
    };

    // Decline incoming call
    const declineCall = () => {
        if (!incomingCall) return;

        const callChannel = supabase.channel(`call:${incomingCall.conversationId}`);
        callChannel.send({
            type: 'broadcast',
            event: 'call-declined',
            payload: { declinedBy: currentUserId }
        });

        setIncomingCall(null);
    };

    // Update call duration
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isInCall && callStartTime) {
            interval = setInterval(() => {
                setCallDuration(Math.floor((Date.now() - callStartTime.getTime()) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isInCall, callStartTime]);

    // Listen for incoming calls and signaling
    useEffect(() => {
        if (!currentUserId || conversations.length === 0) return;

        const channels: ReturnType<typeof supabase.channel>[] = [];

        conversations.forEach(conv => {
            const callChannel = supabase.channel(`call:${conv.conversation_id}`);

            callChannel
                .on('broadcast', { event: 'incoming-call' }, ({ payload }) => {
                    if (payload.from !== currentUserId) {
                        setIncomingCall({
                            from: payload.from,
                            fromName: conv.otherUser?.displayName || 'Người dùng',
                            fromAvatar: conv.otherUser?.avatar || '',
                            type: payload.type,
                            conversationId: payload.conversationId,
                            offer: payload.offer
                        } as any);
                    }
                })
                .on('broadcast', { event: 'call-accepted' }, ({ payload }) => {
                    if (payload.acceptedBy !== currentUserId) {
                        setIsInCall(true);
                        setCallStartTime(new Date());
                        setCallStatus('connected');
                    }
                })
                .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                    if (payload.to === currentUserId && peerConnectionRef.current) {
                        try {
                            const remoteDesc = new RTCSessionDescription(payload.answer);
                            await peerConnectionRef.current.setRemoteDescription(remoteDesc);
                        } catch (e) {
                            console.error('Error setting remote description', e);
                        }
                    }
                })
                .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                    if (payload.from !== currentUserId && peerConnectionRef.current) {
                        try {
                            const candidate = new RTCIceCandidate(payload.candidate);
                            await peerConnectionRef.current.addIceCandidate(candidate);
                        } catch (e) {
                            console.error('Error adding ice candidate', e);
                        }
                    }
                })
                .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
                    if (payload.declinedBy !== currentUserId) {
                        toast.error('Cuộc gọi bị từ chối');
                        endCall();
                    }
                })
                .on('broadcast', { event: 'call-ended' }, () => {
                    endCall();
                })
                .subscribe();

            channels.push(callChannel);
        });

        return () => {
            channels.forEach(ch => ch.unsubscribe());
        };
    }, [currentUserId, conversations]);

    // Handle signaling for incoming call flow specifically
    useEffect(() => {
        if (incomingCall && currentUserId) {
            // We need to set up listener for specific signaling for this call if not covered above
            // Actually, the main listener above handles ice-candidates and answer integration
            // But we need to handle the initial OFFER when we ACCEPT the call. 
            // Wait, the OFFER is sent in incoming-call payload or separate?
            // In startCall, we sent offer in incoming-call payload.
        }
    }, [incomingCall]);

    // Format call duration
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Search messages
    const filteredMessages = useMemo(() => {
        if (!messageSearchQuery.trim()) return messages;
        return messages.filter(msg =>
            msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
        );
    }, [messages, messageSearchQuery]);

    // Listen for incoming calls
    useEffect(() => {
        if (!currentUserId) return;

        // Listen on all conversations user is part of
        const channels: ReturnType<typeof supabase.channel>[] = [];

        conversations.forEach(conv => {
            const callChannel = supabase.channel(`call:${conv.conversation_id}`);

            callChannel
                .on('broadcast', { event: 'incoming-call' }, ({ payload }) => {
                    if (payload.from !== currentUserId) {
                        // Show incoming call UI
                        setIncomingCall({
                            from: payload.from,
                            fromName: conv.otherUser?.displayName || 'Người dùng',
                            fromAvatar: conv.otherUser?.avatar || '',
                            type: payload.type,
                            conversationId: payload.conversationId
                        });
                    }
                })
                .on('broadcast', { event: 'call-accepted' }, ({ payload }) => {
                    if (payload.acceptedBy !== currentUserId) {
                        // Other user accepted our call
                        setIsInCall(true);
                        setCallStartTime(new Date());
                        setCallStatus('connected');
                    }
                })
                .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
                    if (payload.declinedBy !== currentUserId) {
                        // Other user declined our call
                        toast.error('Cuộc gọi bị từ chối');
                        setShowCallModal(false);
                        setCallStatus('idle');
                    }
                })
                .on('broadcast', { event: 'call-ended' }, () => {
                    // Call ended by other user
                    setShowCallModal(false);
                    setIsInCall(false);
                    setCallStatus('idle');
                })
                .subscribe();

            channels.push(callChannel);
        });

        return () => {
            channels.forEach(ch => ch.unsubscribe());
        };
    }, [currentUserId, conversations]);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth/login');
                    return;
                }

                const uid = (user as any).id || (user as any).user_id;
                setCurrentUserId(uid);
                await loadConversations();
            } catch (error) {
                setError('Không thể khởi tạo trang');
                setLoading(false);
            }
        };

        init();
    }, [router, loadConversations]);

    // Load messages when conversation selected
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation.conversation_id);

            // Load settings from conversation
            setNickname(selectedConversation.nickname || '');
            setThemeColor(selectedConversation.themeColor || '#10b981');
            setBgColor(selectedConversation.bgColor || '#f9fafb');
            setIsDarkBg(selectedConversation.bgColor === '#1f2937' || selectedConversation.bgColor === '#111827');
            setIsMuted(selectedConversation.isMuted || false);

            // Mark as read
            markAsRead(selectedConversation.conversation_id);

            const channel = supabase
                .channel(`messages:${selectedConversation.conversation_id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${selectedConversation.conversation_id}`
                }, (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages(prev => {
                        // Check duplicate
                        if (prev.some(m => m.message_id === newMessage.message_id)) return prev;

                        // Add and sort by created_at
                        const newList = [...prev, newMessage];
                        return newList.sort((a, b) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                    });
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [selectedConversation, loadMessages, markAsRead]);

    // Realtime presence for online status
    useEffect(() => {
        if (!currentUserId) return;

        const presenceChannel = supabase.channel('online-users', {
            config: { presence: { key: currentUserId } }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const onlineIds = new Set(Object.keys(state));
                setOnlineUsers(onlineIds);
            })
            .on('presence', { event: 'join' }, ({ key }) => {
                setOnlineUsers(prev => new Set([...prev, key]));
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                setOnlineUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(key);
                    return newSet;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
                }
            });

        return () => {
            presenceChannel.unsubscribe();
        };
    }, [currentUserId]);

    // Typing indicator channel
    useEffect(() => {
        if (!selectedConversation || !currentUserId) return;

        const typingChannel = supabase.channel(`typing:${selectedConversation.conversation_id}`);

        typingChannel
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.user_id !== currentUserId) {
                    setTypingUsers(prev => new Set([...prev, payload.user_id]));

                    // Clear typing after 3 seconds
                    setTimeout(() => {
                        setTypingUsers(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(payload.user_id);
                            return newSet;
                        });
                    }, 3000);
                }
            })
            .subscribe();

        return () => {
            typingChannel.unsubscribe();
        };
    }, [selectedConversation, currentUserId]);

    // Broadcast typing status
    const broadcastTyping = useCallback(() => {
        if (!selectedConversation || !currentUserId) return;

        supabase.channel(`typing:${selectedConversation.conversation_id}`)
            .send({
                type: 'broadcast',
                event: 'typing',
                payload: { user_id: currentUserId }
            });
    }, [selectedConversation, currentUserId]);

    // Handle typing input
    const handleTyping = useCallback((value: string) => {
        setNewMessage(value);

        if (!isTyping) {
            setIsTyping(true);
            broadcastTyping();
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 2000);
    }, [isTyping, broadcastTyping]);

    // Filter conversations
    const filteredConversations = useMemo(() => {
        if (!searchQuery) return conversations;
        return conversations.filter((conv) => {
            const name = conv.otherUser?.displayName || '';
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery]);

    // Loading
    if (loading) {
        return (
            <div className="h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Có lỗi xảy ra</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => { setError(null); setLoading(true); loadConversations(); }}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const otherUser = selectedConversation?.otherUser;
    const displayName = nickname || otherUser?.displayName || 'Người dùng';

    return (
        <div className="h-screen bg-white flex overflow-hidden">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.json"
            />

            {/* Left - Conversations List */}
            <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col bg-white border-r border-gray-200`}>
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-2xl font-bold text-gray-900">Đoạn chat</h1>
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm trên Messenger"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>Chưa có cuộc trò chuyện</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isSelected = selectedConversation?.conversation_id === conv.conversation_id;
                            const user = conv.otherUser || { displayName: 'Người dùng', avatar: '' };
                            const convDisplayName = conv.nickname || user.displayName;
                            const isOnline = conv.otherUser?.id && onlineUsers.has(conv.otherUser.id);

                            return (
                                <div
                                    key={conv.conversation_id}
                                    onClick={() => { setSelectedConversation(conv); setShowInfoPanel(false); }}
                                    className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="relative">
                                        <Image
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=10b981&color=fff`}
                                            alt={convDisplayName}
                                            width={56}
                                            height={56}
                                            className="rounded-full object-cover w-14 h-14"
                                            unoptimized
                                        />
                                        <span className={`absolute bottom-0 right-0 w-4 h-4 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} rounded-full border-2 border-white`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-semibold truncate ${(conv.unreadCount ?? 0) > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {convDisplayName}
                                            </h3>
                                            {typeof conv.unreadCount === 'number' && conv.unreadCount > 0 && (
                                                <span className="ml-2 min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${conv.unreadCount ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                            {conv.lastMessage?.content || 'Bắt đầu trò chuyện'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Center - Chat Area */}
            <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedConversation(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <Image
                                    src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`}
                                    alt="Avatar"
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover w-10 h-10"
                                    unoptimized
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                                    {otherUser?.id && onlineUsers.has(otherUser.id) ? (
                                        <span className="text-xs flex items-center gap-1" style={{ color: themeColor }}>
                                            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }}></span>
                                            Đang hoạt động
                                        </span>
                                    ) : (
                                        <span className="text-xs flex items-center gap-1 text-gray-400">
                                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                            Ngoại tuyến
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => startCall('voice')}
                                    className="p-2.5 hover:bg-gray-100 rounded-full"
                                    style={{ color: themeColor }}
                                >
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => startCall('video')}
                                    className="p-2.5 hover:bg-gray-100 rounded-full"
                                    style={{ color: themeColor }}
                                >
                                    <Video className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setShowInfoPanel(!showInfoPanel)}
                                    className={`p-2.5 rounded-full ${showInfoPanel ? 'bg-green-100' : 'hover:bg-gray-100'}`}
                                    style={{ color: themeColor }}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Message Search Bar */}
                        {showMessageSearch && (
                            <div className="p-2 bg-gray-50 border-b flex items-center gap-2 flex-shrink-0">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={messageSearchQuery}
                                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                                    placeholder="Tìm kiếm trong đoạn chat..."
                                    className="flex-1 bg-transparent outline-none text-sm"
                                    autoFocus
                                />
                                <button onClick={() => { setShowMessageSearch(false); setMessageSearchQuery(''); }} className="p-1 hover:bg-gray-200 rounded">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-2"
                            style={{ backgroundColor: bgColor, color: isDarkBg ? 'white' : 'inherit' }}
                        >
                            {filteredMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Image
                                        src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`}
                                        alt="Avatar"
                                        width={80}
                                        height={80}
                                        className="rounded-full mb-4 object-cover w-20 h-20"
                                        unoptimized
                                    />
                                    <h3 className="font-semibold text-lg">{displayName}</h3>
                                    <p className="text-sm opacity-60">{messageSearchQuery ? 'Không tìm thấy tin nhắn' : 'Bắt đầu cuộc trò chuyện'}</p>
                                </div>
                            ) : (
                                filteredMessages.map((msg) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const isHighlighted = messageSearchQuery && msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase());

                                    return (
                                        <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {!isMe && (
                                                <Image
                                                    src={otherUser?.avatar || `https://ui-avatars.com/api/?name=U&background=10b981&color=fff`}
                                                    alt="Avatar"
                                                    width={28}
                                                    height={28}
                                                    className="rounded-full mr-2 self-end object-cover w-7 h-7"
                                                    unoptimized
                                                />
                                            )}
                                            <div
                                                className={`max-w-[70%] px-4 py-2 rounded-2xl ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
                                                style={{
                                                    backgroundColor: isMe ? themeColor : (isDarkBg ? '#374151' : '#e5e7eb'),
                                                    color: isMe ? 'white' : (isDarkBg ? 'white' : '#111827')
                                                }}
                                            >
                                                {/* Image */}
                                                {msg.type === 'image' && (msg.media_url || msg.content?.startsWith('http') || msg.metadata?.media_url) && (
                                                    <div className="relative group cursor-pointer" onClick={() => setPreviewImage(msg.media_url || msg.metadata?.media_url || msg.content)}>
                                                        <Image
                                                            src={msg.media_url || msg.metadata?.media_url || msg.content}
                                                            alt="Image"
                                                            width={200}
                                                            height={200}
                                                            className="rounded-lg mb-1 transition-transform hover:scale-[1.02]"
                                                            unoptimized
                                                        />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                                                            <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Voice Message */}
                                                {(msg.type === 'voice' || msg?.metadata?.type === 'voice' || (msg.type === 'text' && msg.content === '🎤 Tin nhắn thoại' && msg.media_url)) && (
                                                    <div className="flex items-center gap-2 min-w-[200px]">
                                                        {(msg.media_url || msg?.metadata?.media_url) ? (
                                                            <audio controls className="w-full h-8" src={msg.media_url || msg?.metadata?.media_url} />
                                                        ) : (
                                                            <span className="italic text-sm">Đang xử lý âm thanh...</span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Location Message */}
                                                {(msg.type === 'location' || msg?.metadata?.type === 'location' || (msg.type === 'text' && msg.content.includes('maps.google.com'))) && (
                                                    <div className="flex flex-col gap-2">
                                                        <a
                                                            href={msg.content.includes('http') ? msg.content : (msg?.metadata?.location_url || '#')}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="underline font-semibold flex items-center gap-1"
                                                        >
                                                            <MapPin className="w-4 h-4" />
                                                            {msg.content.replace('📍 Vị trí của tôi: ', '').replace('https://maps.google.com/maps?q=', 'Vị trí: ')}
                                                        </a>
                                                        {/* Map Preview */}
                                                        <iframe
                                                            width="240"
                                                            height="150"
                                                            frameBorder="0"
                                                            style={{ border: 0, borderRadius: '8px' }}
                                                            src={`https://maps.google.com/maps?q=${(msg.content.includes('q=') ? msg.content.split('q=')[1]?.split('&')[0] : msg?.metadata?.location_url?.split('q=')[1]?.split('&')[0] || '')}&output=embed`}
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                )}

                                                {/* Video Message */}
                                                {msg.type === 'video' && (msg.media_url || msg.content?.startsWith('http') || msg.metadata?.media_url) && (
                                                    <div className="max-w-xs">
                                                        <video
                                                            src={msg.media_url || msg.metadata?.media_url || msg.content}
                                                            controls
                                                            className="rounded-lg w-full max-h-60 bg-black"
                                                        />
                                                    </div>
                                                )}

                                                {/* File Attachment */}
                                                {(msg?.metadata?.type === 'file' || msg.content.startsWith('📎 Tệp:')) && (
                                                    <a
                                                        href={msg?.metadata?.file_url || msg.media_url || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 p-2 rounded-lg ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                                                    >
                                                        <div className="p-2 bg-white rounded-full">
                                                            <FileText className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-sm font-medium truncate max-w-[150px]">
                                                                {msg?.metadata?.file_name || msg.content.replace('📎 Tệp: ', '')}
                                                            </span>
                                                            <span className="text-xs opacity-70">
                                                                {msg?.metadata?.file_size ? `${(msg.metadata.file_size / 1024).toFixed(1)} KB` : 'Tải xuống'}
                                                            </span>
                                                        </div>
                                                    </a>
                                                )}

                                                {/* Text Content */}
                                                {msg.type !== 'image' && msg.type !== 'voice' && msg.type !== 'location' && msg?.metadata?.type !== 'voice' && msg?.metadata?.type !== 'location' && !msg.content.startsWith('📍 Vị trí') && (
                                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                                )}

                                                {/* Timestamp */}
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {/* Message Status */}
                                            {isMe && (
                                                <div className="flex items-end ml-1">
                                                    <Check className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Typing Indicator */}
                        {typingUsers.size > 0 && otherUser?.id && typingUsers.has(otherUser.id) && (
                            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-sm text-gray-500">{displayName} đang nhập...</span>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                {/* Attach Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                        style={{ color: themeColor }}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>

                                    {showAttachMenu && (
                                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 w-48 z-10">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <ImageIcon className="w-5 h-5 text-blue-500" />
                                                Ảnh / Video
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <FileText className="w-5 h-5 text-orange-500" />
                                                Tệp đính kèm
                                            </button>
                                            <button
                                                onClick={handleShareLocation}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <MapPin className="w-5 h-5 text-red-500" />
                                                Vị trí
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Voice Recording */}
                                <button
                                    onClick={handleVoiceRecord}
                                    className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-100'}`}
                                    style={{ color: isRecording ? 'white' : themeColor }}
                                >
                                    <Mic className="w-5 h-5" />
                                </button>

                                {/* Message Input */}
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => handleTyping(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        placeholder="Aa"
                                        className="w-full px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none pr-10"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            style={{ color: themeColor }}
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>

                                        {/* Emoji Picker Popup */}
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-10 right-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-72 z-50">
                                                <div className="text-xs text-gray-500 mb-2">Emoji</div>
                                                <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                                                    {['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊',
                                                        '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗',
                                                        '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤗',
                                                        '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
                                                        '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔',
                                                        '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
                                                        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                                                        '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
                                                        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
                                                        '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'].map((emoji, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => {
                                                                    handleTyping(newMessage + emoji);
                                                                    setShowEmojiPicker(false);
                                                                }}
                                                                className="w-8 h-8 text-xl hover:bg-gray-100 rounded flex items-center justify-center transition-transform hover:scale-110"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Send Button */}
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!newMessage.trim() || sendingMessage}
                                    className="p-2.5 hover:bg-green-50 rounded-full disabled:text-gray-400"
                                    style={{ color: newMessage.trim() ? themeColor : undefined }}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-600">Chọn đoạn chat</h3>
                            <p className="text-gray-400">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right - Info Panel */}
            <AnimatePresence>
                {showInfoPanel && selectedConversation && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: window.innerWidth < 1024 ? '100%' : 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="fixed inset-y-0 right-0 z-40 bg-white border-l border-gray-200 shadow-xl flex flex-col lg:relative lg:z-0 lg:shadow-none"
                    >
                        <div className="flex-1 overflow-y-auto">
                            {/* User Info */}
                            <div className="p-6 text-center border-b border-gray-100 relative">
                                <button
                                    onClick={() => setShowInfoPanel(false)}
                                    className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full lg:hidden"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                                <Image
                                    src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`}
                                    alt="Avatar"
                                    width={80}
                                    height={80}
                                    className="rounded-full mx-auto mb-3 object-cover w-20 h-20"
                                    unoptimized
                                />
                                <h3 className="font-bold text-lg text-gray-900">{displayName}</h3>
                                {otherUser?.id && onlineUsers.has(otherUser.id) ? (
                                    <p className="text-sm" style={{ color: themeColor }}>Đang hoạt động</p>
                                ) : (
                                    <p className="text-sm text-gray-400">Ngoại tuyến</p>
                                )}

                                {/* Quick Actions */}
                                <div className="flex justify-center gap-4 mt-4">
                                    <button
                                        onClick={() => router.push(`/profile/${otherUser?.id}`)}
                                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-xl"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-700" />
                                        </div>
                                        <span className="text-xs text-gray-600">Trang cá nhân</span>
                                    </button>
                                    <button
                                        onClick={handleToggleMute}
                                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-xl"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-100' : 'bg-gray-100'}`}>
                                            {isMuted ? <BellOff className="w-5 h-5 text-red-600" /> : <Bell className="w-5 h-5 text-gray-700" />}
                                        </div>
                                        <span className="text-xs text-gray-600">{isMuted ? 'Đã tắt' : 'Thông báo'}</span>
                                    </button>
                                    <button
                                        onClick={() => setShowMessageSearch(true)}
                                        className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-xl"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Search className="w-5 h-5 text-gray-700" />
                                        </div>
                                        <span className="text-xs text-gray-600">Tìm kiếm</span>
                                    </button>
                                </div>
                            </div>

                            {/* Sections */}
                            <div className="divide-y divide-gray-100">
                                {/* Customize */}
                                <div>
                                    <button
                                        onClick={() => toggleSection('customize')}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                                    >
                                        <span className="font-semibold text-gray-900">Tùy chỉnh đoạn chat</span>
                                        {expandedSections.customize ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                    {expandedSections.customize && (
                                        <div className="px-4 pb-4 space-y-2">
                                            {/* Theme Color */}
                                            <button
                                                onClick={() => { setShowThemePicker(!showThemePicker); setShowBgPicker(false); }}
                                                className="w-full p-2 text-left text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3"
                                            >
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: themeColor }} />
                                                Đổi chủ đề
                                            </button>
                                            {showThemePicker && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {THEME_COLORS.map((t) => (
                                                            <button
                                                                key={t.color}
                                                                onClick={() => {
                                                                    setThemeColor(t.color);
                                                                    setShowThemePicker(false);
                                                                    toast.success(`Chủ đề: ${t.name}`);
                                                                    if (selectedConversation) saveSettings(selectedConversation.conversation_id, { themeColor: t.color });
                                                                }}
                                                                className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                                                                style={{ backgroundColor: t.color }}
                                                            >
                                                                {themeColor === t.color && <Check className="w-4 h-4 text-white" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Background Color */}
                                            <button
                                                onClick={() => { setShowBgPicker(!showBgPicker); setShowThemePicker(false); }}
                                                className="w-full p-2 text-left text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3"
                                            >
                                                <Palette className="w-5 h-5 text-gray-600" />
                                                Đổi màu nền
                                            </button>
                                            {showBgPicker && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {BG_COLORS.map((b) => (
                                                            <button
                                                                key={b.color}
                                                                onClick={() => {
                                                                    setBgColor(b.color);
                                                                    setIsDarkBg(b.dark);
                                                                    setShowBgPicker(false);
                                                                    toast.success(`Nền: ${b.name}`);
                                                                    if (selectedConversation) saveSettings(selectedConversation.conversation_id, { bgColor: b.color });
                                                                }}
                                                                className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform border border-gray-300"
                                                                style={{ backgroundColor: b.color }}
                                                            >
                                                                {bgColor === b.color && <Check className={`w-4 h-4 ${b.dark ? 'text-white' : 'text-gray-800'}`} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Nickname */}
                                            <button
                                                onClick={() => setShowNicknameEdit(!showNicknameEdit)}
                                                className="w-full p-2 text-left text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3"
                                            >
                                                <Edit3 className="w-5 h-5 text-gray-600" />
                                                Chỉnh sửa biệt danh
                                            </button>
                                            {showNicknameEdit && (
                                                <div className="p-3 bg-gray-50 rounded-lg space-y-4">
                                                    {/* Biệt danh cho đối phương */}
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Biệt danh cho {otherUser?.displayName || 'đối phương'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={nickname}
                                                            onChange={(e) => setNickname(e.target.value)}
                                                            placeholder={otherUser?.displayName || 'Nhập biệt danh'}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>

                                                    {/* Biệt danh cho mình */}
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">
                                                            Biệt danh cho bạn
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={myNickname}
                                                            onChange={(e) => setMyNickname(e.target.value)}
                                                            placeholder="Nhập biệt danh của bạn"
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={handleSaveNickname}
                                                        className="w-full py-2 text-white rounded-lg text-sm"
                                                        style={{ backgroundColor: themeColor }}
                                                    >
                                                        💕 Lưu biệt danh cho cả hai
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Media */}
                                <div>
                                    <button
                                        onClick={() => toggleSection('media')}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                                    >
                                        <span className="font-semibold text-gray-900">File phương tiện ({mediaFiles.length})</span>
                                        {expandedSections.media ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                    {expandedSections.media && (
                                        <div className="px-4 pb-4">
                                            {mediaFiles.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">Chưa có file</p>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-1">
                                                    {mediaFiles.slice(0, 9).map((media) => (
                                                        <div key={media.message_id} className="aspect-square bg-gray-100 rounded overflow-hidden">
                                                            <Image src={media.media_url!} alt="Media" width={100} height={100} className="w-full h-full object-cover" unoptimized />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Privacy */}
                                <div>
                                    <button
                                        onClick={() => toggleSection('privacy')}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                                    >
                                        <span className="font-semibold text-gray-900">Quyền riêng tư</span>
                                        {expandedSections.privacy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                    {expandedSections.privacy && (
                                        <div className="px-4 pb-4 space-y-1">
                                            <button
                                                onClick={handleToggleMute}
                                                className="w-full p-2 text-left text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3"
                                            >
                                                {isMuted ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                                                {isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="w-full p-2 text-left text-sm hover:bg-red-50 rounded-lg flex items-center gap-3 text-red-600"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                Xóa đoạn chat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-2xl p-6 max-w-sm w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-2">Xóa đoạn chat?</h3>
                            <p className="text-gray-600 mb-6">Bạn sẽ không thể khôi phục sau khi xóa.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl font-medium">
                                    Hủy
                                </button>
                                <button onClick={handleDeleteConversation} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium">
                                    Xóa
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Call Modal */}
            <AnimatePresence>
                {showCallModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center z-50"
                    >
                        {/* Video Streams */}
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className={`absolute inset-0 w-full h-full object-cover ${callType === 'voice' ? 'hidden' : ''}`}
                        />
                        <div className={`absolute bottom-24 right-4 w-32 h-48 bg-black rounded-xl overflow-hidden shadow-xl border-2 border-white/20 ${callType === 'voice' ? 'hidden' : ''}`}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Call Info Overlay */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-center z-10 ${callType === 'video' && callStatus === 'connected' ? 'absolute top-12 left-0 right-0' : ''}`}
                        >
                            <div className={`relative mb-6 ${callType === 'video' && callStatus === 'connected' ? 'hidden' : ''}`}>
                                <Image
                                    src={otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=200`}
                                    alt={displayName}
                                    width={150}
                                    height={150}
                                    className="rounded-full mx-auto ring-4 ring-white/20 object-cover w-[150px] h-[150px]"
                                    unoptimized
                                />
                                {callType === 'video' && (
                                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                                        <Video className="w-12 h-12 text-white" />
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">{displayName}</h2>
                            <p className="text-gray-200 mb-4 animate-pulse drop-shadow-md">
                                {callStatus === 'calling' ? 'Đang gọi...' : (callType === 'voice' ? 'Cuộc gọi thoại' : 'Cuộc gọi video')}
                            </p>

                            {/* Call Duration */}
                            <div className="text-4xl font-mono text-white mb-8 drop-shadow-md">
                                {formatDuration(callDuration)}
                            </div>
                        </motion.div>

                        {/* Call Controls */}
                        <div className="flex items-center gap-8">
                            <button className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600">
                                <Mic className="w-6 h-6" />
                            </button>

                            <button
                                onClick={endCall}
                                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 shadow-lg"
                            >
                                <Phone className="w-8 h-8 rotate-[135deg]" />
                            </button>

                            {callType === 'video' && (
                                <button className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600">
                                    <Video className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Preview Modal (Lightbox) */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4"
                        onClick={() => setPreviewImage(null)}
                    >
                        {/* Toolbar */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement('a');
                                    link.href = previewImage;
                                    link.download = `image_${Date.now()}.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    toast.success('Đang tải xuống...');
                                }}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
                                title="Tải xuống"
                            >
                                <Download className="w-6 h-6" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(null);
                                }}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Incoming Call Modal */}
            <AnimatePresence>
                {incomingCall && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-4 right-4 z-50 bg-white rounded-2xl shadow-2xl p-4 w-80 border border-green-100"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <Image
                                src={incomingCall.fromAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.fromName)}&background=10b981&color=fff`}
                                alt={incomingCall.fromName}
                                width={56}
                                height={56}
                                className="rounded-full animate-pulse ring-2 ring-green-500 object-cover w-14 h-14"
                                unoptimized
                            />
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{incomingCall.fromName}</h3>
                                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    {incomingCall.type === 'voice' ? <Phone className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                                    Cuộc gọi đến...
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={declineCall}
                                className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 flex items-center justify-center gap-2"
                            >
                                <Phone className="w-4 h-4 rotate-[135deg]" />
                                Từ chối
                            </button>
                            <button
                                onClick={acceptCall}
                                className="flex-1 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
                            >
                                {incomingCall.type === 'voice' ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                Trả lời
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}