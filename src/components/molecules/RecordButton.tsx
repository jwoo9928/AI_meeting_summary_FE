import React, { useState } from 'react';
import { Mic, MicOff, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import RecordInfoPopup from './RecordInfoPopup'; // Import the new popup

interface RecordButtonProps {
    isRecording: boolean;
    processingStarted: boolean;
    recordingCompleted: boolean;
    onToggle: (participants?: number, purpose?: string, title?: string) => void; // Modified to accept optional params
    onStartGeneration: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
    isRecording,
    processingStarted,
    recordingCompleted,
    onToggle,
    onStartGeneration,
}) => {
    const [isInfoPopupVisible, setIsInfoPopupVisible] = useState(false);

    // Hide button when processing starts
    if (processingStarted) {
        return null;
    }

    const handleStartRecordingClick = () => {
        setIsInfoPopupVisible(true); // Show the popup
    };

    const handlePopupConfirm = (participants: number, purpose: string, title: string) => {
        onToggle(participants, purpose, title); // Call original onToggle with new data
        setIsInfoPopupVisible(false); // Hide popup
    };

    const handlePopupCancel = () => {
        setIsInfoPopupVisible(false); // Hide popup
    };

    // Determine button state: Recording, Stopped, or Generate
    let buttonContent;
    let buttonClass;
    let buttonAction;
    let buttonLabel;

    if (recordingCompleted) {
        // State: Recording finished, show Generate button
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
        // State: Currently recording
        buttonContent = <MicOff size={28} className="text-white" />;
        buttonClass = 'bg-red-500 hover:bg-red-600 focus:ring-red-300 w-16';
        buttonAction = () => onToggle(); // Stop recording doesn't need params
        buttonLabel = 'Stop Recording';
    } else {
        // State: Ready to start recording
        buttonContent = <Mic size={28} className="text-white" />;
        buttonClass = 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 w-16';
        buttonAction = handleStartRecordingClick; // Show popup first
        buttonLabel = 'Start Recording';
    }

    return (
        <>
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
            <RecordInfoPopup
                isVisible={isInfoPopupVisible}
                onConfirm={handlePopupConfirm}
                onCancel={handlePopupCancel}
            />
        </>
    );
};

export default RecordButton;
