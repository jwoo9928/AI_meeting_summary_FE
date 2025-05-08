import React, { useEffect, useRef, useState } from 'react'; // Added useState
import { motion } from 'framer-motion';
import { Users, UploadCloud } from 'lucide-react'; // Added UploadCloud

interface ReportPreviewProps {
    previewRef: React.RefObject<HTMLDivElement | null>;
    aiHighlightMode: boolean;
    isRecording: boolean;
    processingStarted: boolean;
    generatedHtml: string | null;
    // recordingCompleted: boolean; // No longer needed here, completionMessage handles its display purpose
    onFileDrop: (file: File) => void;
    completionMessage: string | null; // New prop for dynamic completion message
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
    previewRef,
    aiHighlightMode,
    isRecording,
    processingStarted,
    generatedHtml,
    // recordingCompleted, // Removed
    onFileDrop,
    completionMessage, // Destructure new prop
}) => {
    const shadowHostRef = useRef<HTMLDivElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleDragOverEvent = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isRecording && !processingStarted && !generatedHtml) { // Only allow drag over if in initial state
            setDragOver(true);
        }
    };

    const handleDragLeaveEvent = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);
    };

    const handleDropEvent = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);
        if (!isRecording && !processingStarted && !generatedHtml) { // Only process drop if in initial state
            if (event.dataTransfer.files && event.dataTransfer.files[0]) {
                const file = event.dataTransfer.files[0];
                if (file.type.startsWith('audio/')) {
                    onFileDrop(file);
                } else {
                    alert('음성 파일만 업로드할 수 있습니다. (예: mp3, wav, m4a)');
                }
            }
        }
    };

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
            className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-8 min-h-[600px] relative transition-all duration-300 
                ${aiHighlightMode ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-gray-200'}`} // Visual feedback for dragOver
            onDragOver={handleDragOverEvent}
            onDragLeave={handleDragLeaveEvent}
            onDrop={handleDropEvent}
        >
            {/* Initial Placeholder or Recording Completed Message - Now also the drop zone */}
            {!isRecording && !processingStarted && !generatedHtml && (
                <div className="flex flex-col items-center justify-center h-full min-h-[calc(600px-4rem)] text-center cursor-default"> {/* Adjusted height and cursor */}
                    {dragOver ? (
                        <>
                            <UploadCloud size={64} className="text-blue-500 dark:text-blue-400 mb-4" />
                            <p className="text-xl font-semibold text-blue-600 dark:text-blue-300">
                                파일을 놓아 업로드하세요.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                음성 파일 (mp3, wav, m4a 등)을 여기에 드롭하세요.
                            </p>
                        </>
                    ) : completionMessage ? ( // Check completionMessage first
                        <>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                                <Users size={56} className="text-gray-400 mb-4" />
                            </motion.div>
                            <p className="text-green-600 text-lg font-medium mb-2">{completionMessage}</p>
                            <p className="text-sm text-gray-400">문서 생성 버튼을 눌러 계속 진행하세요.</p>
                        </>
                    ) : ( // Fallback to initial message if no completionMessage (and not dragging)
                        <>
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                                <Users size={56} className="text-gray-400 mb-4" />
                            </motion.div>
                            <p className="text-gray-600 text-lg font-medium mb-2">회의를 시작하려면 녹음 버튼을 누르세요.</p>
                            <p className="text-sm text-gray-400">또는 음성 파일을 이 곳에 드래그 앤 드롭하여 바로 시작할 수 있습니다.</p>
                        </>
                    )}
                </div>
            )}

            {/* Container for Shadow DOM - Only render if HTML is present */}
            {generatedHtml && (
                <div ref={shadowHostRef} className="prose prose-sm max-w-none">
                    {/* Content will be rendered inside Shadow DOM via useEffect */}
                </div>
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
