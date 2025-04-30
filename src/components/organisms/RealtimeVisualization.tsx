import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Zap } from 'lucide-react';

type RealtimeVisualizationProps = {
    canvasRef: React.RefObject<HTMLCanvasElement>;
    liveKeywords: string[];
};

const RealtimeVisualization: React.FC<RealtimeVisualizationProps> = ({
    canvasRef,
    liveKeywords,
}) => {
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
