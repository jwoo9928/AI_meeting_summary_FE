import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

type AppHeaderProps = {
    isRecording: boolean;
    recordingTime: number;
    processingStarted: boolean;
    aiHighlightMode: boolean;
    onToggleAiHighlight: () => void;
    formatTime: (seconds: number) => string;
};

const AppHeader: React.FC<AppHeaderProps> = ({
    isRecording,
    recordingTime,
    processingStarted,
    aiHighlightMode,
    onToggleAiHighlight,
    formatTime,
}) => {
    return (
        <div className="bg-white border-b border-gray-200 py-3 sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">회의 녹음 및 분석</h1>
                    {/* AI Highlight Toggle */}
                    {processingStarted && !isRecording && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className={`ml-5 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center transition-all border ${aiHighlightMode
                                ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                }`}
                            onClick={onToggleAiHighlight}
                        >
                            <Zap size={14} className={`mr-1.5 ${aiHighlightMode ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span>AI 강조 모드 {aiHighlightMode ? 'ON' : 'OFF'}</span>
                        </motion.button>
                    )}
                </div>

                {/* Recording Status */}
                {isRecording && (
                    <div className="flex items-center px-4 py-1.5 rounded-full bg-red-50 border border-red-200 shadow-sm">
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop' }}
                            className="h-2.5 w-2.5 bg-red-500 rounded-full mr-2.5"
                        />
                        <span className="text-sm font-medium text-red-600">{formatTime(recordingTime)}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppHeader;
