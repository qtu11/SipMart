'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Pause, Play, RotateCcw, CupSoda } from 'lucide-react';
import Link from 'next/link';
import SocialLayout from '@/components/social/SocialLayout';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function CupCatchGame() {
    const { user } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [greenPoints, setGreenPoints] = useState(0);

    // Game Constants
    const BASKET_WIDTH = 80;
    const BASKET_HEIGHT = 60;
    const ITEM_SIZE = 40;
    const SPEED_INITIAL = 3;

    // Game State Refs (for animation loop)
    const basketX = useRef(150);
    const items = useRef<{ x: number; y: number; type: 'cup' | 'trash'; id: number }[]>([]);
    const lastSpawn = useRef(0);
    const speed = useRef(SPEED_INITIAL);
    const animationFrameId = useRef<number>();
    const scoreRef = useRef(0);

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size to parent container
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = Math.max(500, parent.clientHeight); // Min height 500
                basketX.current = canvas.width / 2 - BASKET_WIDTH / 2;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const spawnItem = (width: number) => {
        const type = Math.random() > 0.3 ? 'cup' : 'trash'; // 70% chance for cup
        items.current.push({
            x: Math.random() * (width - ITEM_SIZE),
            y: -ITEM_SIZE,
            type,
            id: Date.now() + Math.random(),
        });
    };

    const endGame = useCallback(async () => {
        setIsPlaying(false);
        setGameOver(true);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);

        // Submit Score
        try {
            const res = await fetch('/api/games/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameType: 'cup_catch', score: scoreRef.current })
            });
            const data = await res.json();
            if (data.success && data.greenPointsEarned > 0) {
                setGreenPoints(data.greenPointsEarned);
                toast.success(`Bạn nhận được ${data.greenPointsEarned} Green Points!`);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const update = useCallback(() => {
        if (!isPlaying || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Spawn logic
        if (Date.now() - lastSpawn.current > 1000 / (speed.current * 0.5)) {
            spawnItem(canvas.width);
            lastSpawn.current = Date.now();
        }

        // Move & Draw Items
        items.current.forEach((item, index) => {
            item.y += speed.current; // Move down

            // Draw
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.type === 'cup' ? '🥤' : '🧴', item.x + ITEM_SIZE / 2, item.y + ITEM_SIZE / 2 + 10);

            // Collision with Bottom
            if (item.y > canvas.height) {
                items.current.splice(index, 1);
            }

            // Collision with Basket
            const basketY = canvas.height - BASKET_HEIGHT - 10;
            if (
                item.y + ITEM_SIZE > basketY &&
                item.x + ITEM_SIZE > basketX.current &&
                item.x < basketX.current + BASKET_WIDTH
            ) {
                // CAUGHT!
                if (item.type === 'cup') {
                    scoreRef.current += 10;
                    setScore(scoreRef.current);
                    speed.current += 0.05; // Increase speed slightly
                } else {
                    // Caught TRASH
                    setLives(prev => {
                        const newLives = prev - 1;
                        if (newLives <= 0) {
                            endGame();
                        }
                        return newLives;
                    });
                    toast.error('Ouch! Đừng hứng chai nhựa!', { duration: 1000, icon: '⚠️' });
                }
                items.current.splice(index, 1);
            }
        });

        // Draw Basket
        const basketY = canvas.height - BASKET_HEIGHT - 10;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        // Simple Basket Shape
        ctx.roundRect(basketX.current, basketY, BASKET_WIDTH, BASKET_HEIGHT, 10);
        ctx.fill();

        // Basket Icon/Text
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('🧺', basketX.current + BASKET_WIDTH / 2, basketY + BASKET_HEIGHT / 2 + 8);

        if (!gameOver) {
            animationFrameId.current = requestAnimationFrame(update);
        }
    }, [isPlaying, gameOver, endGame]);

    // Start Animation Loop
    useEffect(() => {
        if (isPlaying && !gameOver) {
            lastSpawn.current = Date.now();
            animationFrameId.current = requestAnimationFrame(update);
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        }
    }, [isPlaying, gameOver, update]);

    // Controls
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!canvasRef.current || !isPlaying) return;
        const touch = e.touches[0];
        const rect = canvasRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        basketX.current = Math.max(0, Math.min(canvasRef.current.width - BASKET_WIDTH, x - BASKET_WIDTH / 2));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current || !isPlaying) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        basketX.current = Math.max(0, Math.min(canvasRef.current.width - BASKET_WIDTH, x - BASKET_WIDTH / 2));
    };

    const startGame = () => {
        setScore(0);
        scoreRef.current = 0;
        setLives(3);
        items.current = [];
        speed.current = SPEED_INITIAL;
        setGameOver(false);
        setIsPlaying(true);
        setGreenPoints(0);
    };

    return (
        <SocialLayout user={user}>
            <div className="max-w-2xl mx-auto h-[90vh] flex flex-col pb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 px-4 pt-2">
                    <Link href="/games" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Link>
                    <div className="flex gap-4">
                        <div className="bg-green-100 text-green-700 font-bold px-4 py-1 rounded-full border border-green-200">
                            Điểm: {score}
                        </div>
                        <div className="bg-red-100 text-red-700 font-bold px-4 py-1 rounded-full border border-red-200">
                            Mạng: {'❤️'.repeat(lives)}
                        </div>
                    </div>
                </div>

                {/* Game Container */}
                <div className="flex-1 relative bg-gradient-to-b from-blue-50 to-white rounded-xl overflow-hidden border-2 border-dashed border-gray-300 mx-2 shadow-inner">
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full block touch-none"
                        onTouchMove={handleTouchMove}
                        onMouseMove={handleMouseMove}
                    />

                    {/* Start Screen Overlay */}
                    {!isPlaying && !gameOver && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
                            <div className="bg-white text-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
                                <CupSoda className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Hứng Ly Nhựa</h2>
                                <p className="text-gray-500 mb-6">Di chuyển giỏ để hứng các ly sạch (🥤). Tránh xa các chai nhựa độc hại (🧴)!</p>
                                <button
                                    onClick={startGame}
                                    className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5 fill-current" /> Bắt đầu
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Over Screen */}
                    {gameOver && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-300">
                            <div className="bg-white text-gray-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
                                <div className="text-5xl mb-2">🏁</div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-1">Kết Thúc!</h2>
                                <p className="text-gray-500 mb-6">Bạn đã hết mạng</p>

                                <div className="bg-yellow-50 rounded-xl p-4 mb-6 border border-yellow-100">
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tổng điểm</div>
                                    <div className="text-4xl font-black text-yellow-600">{score}</div>
                                    {greenPoints > 0 && (
                                        <div className="mt-2 text-sm text-green-600 font-bold flex items-center justify-center gap-1">
                                            + {greenPoints} Green Points
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={startGame}
                                        className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-5 h-5" /> Chơi Lại
                                    </button>
                                    <Link href="/games">
                                        <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                                            Thoát
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-2">
                    Di chuyển chuột hoặc vuốt màn hình để điều khiển
                </p>
            </div>
        </SocialLayout>
    );
}
