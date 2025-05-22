import React from 'react';
import { motion } from 'framer-motion';

const VoiceAnimation: React.FC = () => {
    return (
        <div className="flex items-center justify-center space-x-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                    }}
                />
            ))}
            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">녹음 중...</span>
        </div>
    );
};

export default React.memo(VoiceAnimation);
