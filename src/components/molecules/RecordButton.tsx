import React from 'react';
import { Mic, MicOff, FileText } from 'lucide-react'; // Added FileText
import { motion } from 'framer-motion';

interface RecordButtonProps {
    isRecording: boolean;
    processingStarted: boolean;
    recordingCompleted: boolean; // Added recordingCompleted prop
    onToggle: () => void;
    onStartGeneration: () => void; // Added generation handler prop
}

const RecordButton: React.FC<RecordButtonProps> = ({
    isRecording,
    processingStarted,
    recordingCompleted, // Destructure new prop
    onToggle,
    onStartGeneration, // Destructure new prop
}) => {
    // Hide button when processing starts
    if (processingStarted) {
        return null;
    }

    // Determine button state: Recording, Stopped, or Generate
    let buttonContent;
    let buttonClass;
    let buttonAction;
    let buttonLabel;

    if (recordingCompleted) {
        // State: Recording finished, show Generate button
        buttonContent = (
            <>
                <FileText size={24} className="text-white mr-2" /> {/* Icon + Text */}
                <span className="text-sm font-semibold">문서 생성</span>
            </>
        );
        buttonClass = 'bg-green-500 hover:bg-green-600 focus:ring-green-300 w-auto px-5'; // Green, wider for text
        buttonAction = onStartGeneration;
        buttonLabel = 'Generate Document';
    } else if (isRecording) {
        // State: Currently recording
        buttonContent = <MicOff size={28} className="text-white" />;
        buttonClass = 'bg-red-500 hover:bg-red-600 focus:ring-red-300 w-16'; // Red, original size
        buttonAction = onToggle;
        buttonLabel = 'Stop Recording';
    } else {
        // State: Ready to start recording
        buttonContent = <Mic size={28} className="text-white" />;
        buttonClass = 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 w-16'; // Blue, original size
        buttonAction = onToggle;
        buttonLabel = 'Start Recording';
    }


    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
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
