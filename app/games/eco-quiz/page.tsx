'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, XCircle, Award, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import SocialLayout from '@/components/social/SocialLayout';
import { useAuth } from '@/hooks/useAuth';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Mock Questions (could be moved to DB later)
const QUESTIONS = [
    {
        id: 1,
        question: "Loại nhựa nào sau đây có thể tái chế dễ dàng nhất?",
        options: ["PET (Nhựa số 1)", "PVC (Nhựa số 3)", "PS (Nhựa số 6)", "Other (Nhựa số 7)"],
        correct: 0,
        explanation: "PET (Polyethylene Terephthalate) là loại nhựa được tái chế rộng rãi nhất, thường dùng cho chai nước."
    },
    {
        id: 2,
        question: "Thời gian phân hủy trung bình của một chai nhựa ngoài môi trường là bao lâu?",
        options: ["10 năm", "100 năm", "450-1000 năm", "Vĩnh viễn"],
        correct: 2,
        explanation: "Chai nhựa mất từ 450 đến 1000 năm để phân hủy hoàn toàn trong tự nhiên."
    },
    {
        id: 3,
        question: "Hành động nào tiết kiệm nước nhất khi rửa bát?",
        options: ["Xả vòi liên tục", "Dùng bồn rửa/chậu hứng nước", "Rửa từng cái một dưới vòi", "Dùng máy rửa bát chế độ Eco"],
        correct: 1,
        explanation: "Dùng bồn/chậu để hứng nước rửa giúp tiết kiệm lượng nước đáng kể so với xả vòi trực tiếp."
    },
    {
        id: 4,
        question: "Biểu tượng 3 mũi tên xoay vòng có ý nghĩa gì?",
        options: ["Sản phẩm độc hại", "Tái sử dụng - Tái chế - Giảm thiểu", "Hàng dễ vỡ", "Tránh ánh nắng"],
        correct: 1,
        explanation: "Đó là biểu tượng tái chế quốc tế, đại diện cho vòng tuần hoàn: Reduce - Reuse - Recycle."
    },
    {
        id: 5,
        question: "CupSipMart giúp bảo vệ môi trường bằng cách nào?",
        options: ["Bán ly nhựa giá rẻ", "Cung cấp hệ thống mượn ly tái sử dụng", "Thu gom rác thải", "Tuyên truyền"],
        correct: 1,
        explanation: "Mô hình cốt lõi của CupSipMart là hệ thống ly luân chuyển (circulating cups) để giảm ly dùng một lần."
    }
];

export default function EcoQuizGame() {
    const { user } = useAuth();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [greenPoints, setGreenPoints] = useState(0);
    const { width, height } = useWindowSize();

    const handleAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === QUESTIONS[currentQuestion].correct) {
            setScore(s => s + 1);
        }
    };

    const nextQuestion = () => {
        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(c => c + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setShowResult(true);
        // Submit score logic
        try {
            // Calculate points: 10 points per correct answer
            const earnedPoints = score + (selectedOption === QUESTIONS[currentQuestion].correct ? 1 : 0);

            const res = await fetch('/api/games/score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameType: 'eco_quiz', score: earnedPoints * 10 }) // Send raw score for points calculation in API
            });
            const data = await res.json();
            if (data.success) {
                setGreenPoints(data.greenPointsEarned);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const restartQuiz = () => {
        setCurrentQuestion(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setShowResult(false);
        setGreenPoints(0);
    };

    const currentQ = QUESTIONS[currentQuestion];

    return (
        <SocialLayout user={user}>
            {showResult && score === QUESTIONS.length && <Confetti width={width} height={height} recycle={false} />}

            <div className="max-w-2xl mx-auto pb-20 px-4 min-h-[90vh] flex flex-col justify-center">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/games" className="p-2 bg-white rounded-full shadow hover:shadow-md text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        Câu hỏi {currentQuestion + 1} / {QUESTIONS.length}
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        🎯 {score} Điểm
                    </div>
                </div>

                {/* Quiz Content */}
                {!showResult ? (
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100"
                    >
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                            {currentQ.question}
                        </h2>

                        <div className="space-y-4">
                            {currentQ.options.map((option, index) => {
                                let btnClass = "w-full p-4 rounded-xl text-left border-2 transition-all font-medium flex(items-center justify-between) group ";
                                if (isAnswered) {
                                    if (index === currentQ.correct) btnClass += "border-green-500 bg-green-50 text-green-700";
                                    else if (index === selectedOption) btnClass += "border-red-500 bg-red-50 text-red-700";
                                    else btnClass += "border-gray-100 opacity-50";
                                } else {
                                    btnClass += "border-gray-100 hover:border-blue-300 hover:bg-blue-50 text-gray-700";
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={isAnswered}
                                        className={btnClass}
                                    >
                                        <span>{String.fromCharCode(65 + index)}. {option}</span>
                                        {isAnswered && index === currentQ.correct && <CheckCircle className="w-5 h-5 text-green-600" />}
                                        {isAnswered && index === selectedOption && index !== currentQ.correct && <XCircle className="w-5 h-5 text-red-600" />}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Feedback & Next Button */}
                        <AnimatePresence>
                            {isAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 pt-6 border-t border-gray-100"
                                >
                                    <div className="bg-blue-50 p-4 rounded-xl mb-6">
                                        <p className="text-sm text-blue-800">
                                            <span className="font-bold">Giải thích:</span> {currentQ.explanation}
                                        </p>
                                    </div>
                                    <button
                                        onClick={nextQuestion}
                                        className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-primary-700 transition"
                                    >
                                        {currentQuestion < QUESTIONS.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border border-gray-100"
                    >
                        <div className="mb-6 flex justify-center">
                            {score === QUESTIONS.length ? (
                                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center animate-bounce">
                                    <Award className="w-12 h-12 text-yellow-600" />
                                </div>
                            ) : (
                                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-12 h-12 text-blue-600" />
                                </div>
                            )}
                        </div>

                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Hoàn thành!</h2>
                        <p className="text-gray-500 mb-8">Bạn đã trả lời đúng {score}/{QUESTIONS.length} câu hỏi</p>

                        {greenPoints > 0 && (
                            <div className="mb-8 inline-block bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
                                <span className="text-gray-600 text-sm block mb-1">Phần thưởng</span>
                                <span className="text-2xl font-black text-green-600">+{greenPoints} Green Points</span>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={restartQuiz}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Làm lại
                            </button>
                            <Link href="/games" className="flex-1">
                                <button className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg">
                                    Menu Game
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </SocialLayout>
    );
}
