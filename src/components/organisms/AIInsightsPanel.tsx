import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import { KeyInsight } from '../../App'; // Assuming KeyInsight type is exported from App.tsx

interface AIInsightsPanelProps {
    showAIInsights: boolean;
    keyInsights: KeyInsight[];
    sentimentData: number[];
    getSentimentColor: (value: number) => string;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
    showAIInsights,
    keyInsights,
    sentimentData,
    getSentimentColor,
}) => {
    return (
        <AnimatePresence>
            {showAIInsights && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mb-8"
                >
                    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-6">
                        <h2 className="text-xl font-semibold text-blue-800 mb-5 flex items-center">
                            <Award size={22} className="mr-2.5 text-blue-600" />
                            <span>AI 핵심 인사이트 요약</span>
                        </h2>

                        {/* Key Insights List */}
                        <div className="space-y-4 mb-6">
                            {keyInsights.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ x: -30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.15, type: 'spring', stiffness: 150, damping: 20 }}
                                    className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm text-blue-700 font-medium">
                                            인사이트 #{index + 1}
                                        </div>
                                        <div className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            점수: {item.score.toFixed(2)}
                                        </div>
                                    </div>
                                    <p className="text-gray-800 text-base">{item.insight}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Sentiment Analysis Graph */}
                        <div className="mt-8">
                            <h3 className="text-base font-medium text-gray-700 mb-3">회의 분위기 타임라인</h3>
                            <div className="h-28 w-full bg-white rounded-lg p-4 border border-gray-200 flex items-end justify-start space-x-1 overflow-hidden">
                                {sentimentData.map((value, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: `${value * 90}%`, opacity: 1 }}
                                        transition={{ duration: 0.3, delay: index * 0.02 }}
                                        className={`w-1.5 rounded-t ${getSentimentColor(value)}`}
                                        title={`Sentiment: ${value.toFixed(2)}`}
                                    />
                                ))}
                                {sentimentData.length === 0 && (
                                    <p className="text-sm text-gray-400 self-center w-full text-center">감정 데이터 없음</p>
                                )}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                                <span>긍정적</span>
                                <span>중립</span>
                                <span>부정적</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AIInsightsPanel;
