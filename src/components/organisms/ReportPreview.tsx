import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface ReportPreviewProps {
    previewRef: React.RefObject<HTMLDivElement | null>; // Correct type to match useRef(null)
    aiHighlightMode: boolean;
    isRecording: boolean;
    processingStarted: boolean;
    generatedHtml: string | null;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
    previewRef,
    aiHighlightMode,
    isRecording,
    processingStarted,
    generatedHtml,
}) => {
    return (
        <div
            ref={previewRef} // Ref for scrolling
            className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-8 min-h-[600px] relative transition-all duration-300 ${aiHighlightMode ? 'ring-2 ring-blue-400 ring-offset-2' : ''
                }`}
        >
            {/* Initial Placeholder */}
            {!isRecording && !processingStarted && !generatedHtml && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                        <Users size={56} className="text-gray-400 mb-4" />
                    </motion.div>
                    <p className="text-gray-600 text-lg font-medium mb-2">회의를 시작하려면 녹음 버튼을 누르세요.</p>
                    <p className="text-sm text-gray-400">녹음 후 AI가 자동으로 회의 내용을 분석하고 보고서를 생성합니다.</p>
                </div>
            )}

            {/* Display generated HTML */}
            {generatedHtml && (
                <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: generatedHtml }} // Render HTML received from server
                />
            )}

            {/* Loading/Processing Indicator */}
            {processingStarted && !generatedHtml && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50">
                    <div className="text-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                        />
                        <p className="text-lg font-medium text-blue-600">보고서 생성 중...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportPreview;
