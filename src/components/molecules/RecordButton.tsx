import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecordButtonProps {
    isRecording: boolean;
    processingStarted: boolean;
    onToggle: () => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
    isRecording,
    processingStarted,
    onToggle,
}) => {
    // Hide button when processing starts
    if (processingStarted) {
        return null;
    }

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <motion.button
                onClick={onToggle}
                className={`flex items-center justify-center w-16 h-16 rounded-full shadow-xl focus:outline-none focus:ring-4 transition-all duration-300
          ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300'
                        : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
                {isRecording ? (
                    <MicOff size={28} className="text-white" />
                ) : (
                    <Mic size={28} className="text-white" />
                )}
            </motion.button>
        </div>
    );
};

export default RecordButton;
