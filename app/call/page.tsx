'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Users, MessageSquare } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';
import toast from 'react-hot-toast';

export default function CallPage() {
    const [user, setUser] = useState<any>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [micEnabled, setMicEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                const unsubscribe = onAuthChange((user) => {
                    if (user) {
                        setUser(user);
                    } else {
                        router.push('/auth/login');
                    }
                });
                return () => unsubscribe();
            }
        };
        checkUser();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [router]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
            toast.error('Không thể truy cập Camera/Micro');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    };

    const toggleCall = () => {
        if (isCalling) {
            setIsCalling(false);
            stopCamera();
            toast.success('Đã kết thúc cuộc gọi');
        } else {
            setIsCalling(true);
            startCamera();
            toast.success('Đang bắt đầu cuộc gọi video...');
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !micEnabled);
            setMicEnabled(!micEnabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !videoEnabled);
            setVideoEnabled(!videoEnabled);
        }
    };

    if (!user) return null;

    return (
        <SocialLayout user={user}>
            <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-4xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center group">

                    {!isCalling ? (
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Video className="w-10 h-10 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Sẵn sàng gọi video</h2>
                            <p className="text-gray-400 mb-8">Kết nối với bạn bè mọi lúc, mọi nơi</p>

                            <button
                                onClick={toggleCall}
                                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg shadow-green-900/50"
                            >
                                <Phone className="w-6 h-6" /> Bắt đầu cuộc gọi
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Main Video View (Self view for demo) */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transition-opacity ${videoEnabled ? 'opacity-100' : 'opacity-0'}`}
                            />

                            {!videoEnabled && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center">
                                        <div className="text-4xl font-bold text-white uppercase">{user.displayName?.[0] || 'U'}</div>
                                    </div>
                                </div>
                            )}

                            {/* Controls Overlay */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-900/50 backdrop-blur-md px-6 py-4 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={toggleMic}
                                    className={`p-4 rounded-full transition-colors ${micEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                                >
                                    {micEnabled ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
                                </button>

                                <button
                                    onClick={toggleCall}
                                    className="p-4 bg-red-600 hover:bg-red-500 rounded-full px-8 flex items-center gap-2 transform active:scale-95 transition-all"
                                >
                                    <PhoneOff className="w-6 h-6 text-white" />
                                    <span className="text-white font-bold hidden md:inline">Kết thúc</span>
                                </button>

                                <button
                                    onClick={toggleVideo}
                                    className={`p-4 rounded-full transition-colors ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}
                                >
                                    {videoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
                                </button>
                            </div>

                            {/* Top info */}
                            <div className="absolute top-6 left-6 flex items-center gap-2 bg-gray-900/50 backdrop-blur px-3 py-1.5 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-white text-xs font-medium">Đang kết nối...</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </SocialLayout>
    );
}
