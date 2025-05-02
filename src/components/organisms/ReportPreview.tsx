import React, { useEffect, useRef } from 'react'; // Added useEffect, useRef
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface ReportPreviewProps {
    previewRef: React.RefObject<HTMLDivElement | null>;
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
    // Ref for the container that will host the Shadow DOM
    const shadowHostRef = useRef<HTMLDivElement>(null);

    // Effect to update Shadow DOM when generatedHtml changes
    useEffect(() => {
        const hostElement = shadowHostRef.current;
        if (hostElement && generatedHtml) {
            // Ensure shadow root doesn't already exist
            if (!hostElement.shadowRoot) {
                hostElement.attachShadow({ mode: 'open' });
            }
            // Clear previous content and set new HTML
            if (hostElement.shadowRoot) {
                // Apply base Tailwind prose styles if needed within the shadow DOM
                // Note: Tailwind classes won't automatically apply inside Shadow DOM
                // unless the styles are explicitly injected or linked.
                // For simplicity, we'll rely on styles within generatedHtml for now.
                // If base styling is needed, we might need to link a stylesheet.
                hostElement.shadowRoot.innerHTML = `
                    <style>
                    /* Basic prose styling fallback if needed, or link external CSS */
                    /* Consider linking your main CSS or a specific one for reports */
                    /* @import url('/path/to/your/tailwind-output.css'); */

                    /* Add any essential base styles here if generatedHtml lacks them */
                    body { /* Targeting body inside shadow dom */
                        font-family: sans-serif;
                        line-height: 1.6;
                    }
                    /* Add more base styles as required */
                    </style>
                    ${generatedHtml}
                `;
            }
        } else if (hostElement && hostElement.shadowRoot) {
            // Clear content if generatedHtml is null
            hostElement.shadowRoot.innerHTML = '';
        }
    }, [generatedHtml]); // Rerun effect when generatedHtml changes

    return (
        <div
            ref={previewRef} // Keep original ref for scrolling/external access
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

            {/* Container for Shadow DOM */}
            {/* Apply prose styles here if needed for spacing/layout OUTSIDE shadow DOM */}
            <div ref={shadowHostRef} className="prose prose-sm max-w-none">
                {/* Content will be rendered inside Shadow DOM via useEffect */}
            </div>


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
