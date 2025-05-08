import React from 'react';
import { Mic, MicOff, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecordButtonProps {
    isRecording: boolean;
    processingStarted: boolean;
    recordingCompleted: boolean;
    onToggleRecord: () => void; // App.tsx will handle showing popup if it's a "start" action for live recording
    onStartGeneration: () => void;
    initialUploadedFileName: string | null; // Name of file uploaded via ReportPreview, pending info
    onRequestShowInfoPopup: () => void; // To ask App.tsx to show the shared RecordInfoPopup
}

const RecordButton: React.FC<RecordButtonProps> = ({
    isRecording,
    processingStarted,
    recordingCompleted,
    onToggleRecord,
    onStartGeneration,
    initialUploadedFileName,
    onRequestShowInfoPopup,
}) => {
    // Hide button when processing starts
    if (processingStarted) {
        return null;
    }

    let buttonContent;
    let buttonClass;
    let buttonAction;
    let buttonLabel;
    let topMessage = null;

    if (recordingCompleted) {
        // State: Recording finished (or file processed), show Generate button
        buttonContent = (
            <>
                <FileText size={24} className="text-white mr-2" />
                <span className="text-sm font-semibold">문서 생성</span>
            </>
        );
        buttonClass = 'bg-green-500 hover:bg-green-600 focus:ring-green-300 w-auto px-5';
        buttonAction = onStartGeneration;
        buttonLabel = 'Generate Document';
    } else if (isRecording) {
        // State: Currently recording (live)
        buttonContent = <MicOff size={28} className="text-white" />;
        buttonClass = 'bg-red-500 hover:bg-red-600 focus:ring-red-300 w-16';
        buttonAction = onToggleRecord; // This will trigger stop confirmation in App.tsx
        buttonLabel = 'Stop Recording';
    } else if (initialUploadedFileName) {
        // State: File uploaded via ReportPreview, info pending
        buttonContent = (
            <>
                <FileText size={20} className="text-white mr-2" />
                <span className="text-sm font-semibold">회의 정보 입력</span>
            </>
        );
        buttonClass = 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-300 w-auto px-6';
        buttonAction = onRequestShowInfoPopup; // Ask App.tsx to show the shared popup
        buttonLabel = 'Enter Meeting Info for Uploaded File';
        topMessage = (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                업로드된 파일: <span className="font-semibold">{initialUploadedFileName}</span>
            </p>
        );
    } else {
        // State: Ready to start recording (initial state)
        buttonContent = <Mic size={28} className="text-white" />;
        buttonClass = 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 w-16';
        buttonAction = onToggleRecord; // App.tsx will show popup for live recording
        buttonLabel = 'Start Recording';
    }

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center w-full px-4">
            {topMessage}
            <motion.button
                onClick={buttonAction}
                className={`flex items-center justify-center h-16 rounded-full shadow-xl focus:outline-none focus:ring-4 transition-all duration-300 ${buttonClass}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                aria-label={buttonLabel}
            >
                {buttonContent}
            </motion.button>
        </div>
    );
};

export default RecordButton;
