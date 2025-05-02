import React, { useEffect, useRef } from 'react'; // useEffect, useRef 추가
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Zap } from 'lucide-react';

type RealtimeVisualizationProps = {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    liveKeywords: string[];
    isRecording: boolean; // isRecording prop 추가
};

const RealtimeVisualization: React.FC<RealtimeVisualizationProps> = ({
    canvasRef,
    liveKeywords,
    isRecording, // isRecording prop 받기
}) => {
    const animationFrameRef = useRef<number | null>(null); // 애니메이션 프레임 ref 추가

    // 음성 파형 시각화 효과 (App.tsx에서 이동)
    useEffect(() => {
        if (isRecording && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const renderWaveform = () => {
                if (!isRecording || !canvasRef.current) return; // Stop animation if not recording or canvas unmounted

                const width = canvas.width;
                const height = canvas.height;
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.7)'; // Blue color

                const bars = 50; // Number of bars
                const barWidth = width / bars - 2; // Width of each bar with spacing
                const maxBarHeight = height * 0.8; // Max height relative to canvas height
                const centerY = height / 2;

                for (let i = 0; i < bars; i++) {
                    // Simulate varying amplitude
                    const amplitude = Math.random();
                    const barHeight = amplitude * maxBarHeight + height * 0.1; // Add a base height
                    const x = i * (barWidth + 2);
                    const y = centerY - barHeight / 2;

                    ctx.fillRect(x, y, barWidth, barHeight);
                }

                animationFrameRef.current = requestAnimationFrame(renderWaveform);
            };

            renderWaveform(); // Start the animation loop

            return () => {
                // Cleanup: cancel the animation frame when effect unmounts or recording stops
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                // Clear canvas on stop only if canvas still exists
                if (canvasRef.current) {
                    const currentCtx = canvasRef.current.getContext('2d');
                    currentCtx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            };
        } else {
            // Ensure animation stops if isRecording becomes false
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Clear canvas if it exists and recording stops
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [isRecording, canvasRef]); // Rerun effect when isRecording or canvasRef changes

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
        >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <BrainCircuit size={20} className="mr-2 text-blue-500" />
                    <span>실시간 음성 분석</span>
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center"
                    >
                        <Sparkles size={12} className="mr-1.5" />
                        <span>AI 분석 중</span>
                    </motion.div>
                </h2>

                {/* Waveform Canvas */}
                <div className="mb-6 relative h-20 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={1000} // Higher resolution for canvas
                        height={80}
                        className="w-full h-full absolute inset-0"
                    />
                </div>

                {/* Live Keywords */}
                <div className="h-8 flex flex-wrap gap-2 items-center overflow-hidden">
                    <AnimatePresence>
                        {liveKeywords.map((keyword, index) => (
                            <motion.div
                                key={`${keyword}-${index}-${Date.now()}`} // Ensure unique key for animation
                                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.5 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.4 }}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full flex items-center shadow-sm border border-blue-100"
                            >
                                <Zap size={12} className="mr-1.5 text-blue-500" />
                                {keyword}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

export default RealtimeVisualization;
