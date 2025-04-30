import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

// Define the ProcessStep type (can be moved to a shared types file later)
type ProcessStep = {
    id: number;
    title: string;
    status: 'pending' | 'processing' | 'completed';
};

type ProcessStepsBarProps = {
    processSteps: ProcessStep[];
};

const ProcessStepsBar: React.FC<ProcessStepsBarProps> = ({ processSteps }) => {
    return (
        <div className="bg-white border-b border-gray-200 py-4">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex justify-between items-center">
                    {processSteps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center relative z-0">
                                <motion.div
                                    className={`flex items-center justify-center w-9 h-9 rounded-full mb-2 transition-all duration-300 border-2
                        ${step.status === 'completed'
                                            ? 'bg-green-500 border-green-600 text-white'
                                            : step.status === 'processing'
                                                ? 'bg-blue-500 border-blue-600 text-white animate-pulse'
                                                : 'bg-gray-100 border-gray-300 text-gray-400'}`}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: step.status === 'processing' ? 1.1 : 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                >
                                    {step.status === 'completed' ? (
                                        <Check size={18} strokeWidth={3} />
                                    ) : step.status === 'processing' ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold">{step.id}</span>
                                    )}
                                </motion.div>
                                <span className={`text-xs font-medium transition-colors text-center w-20
                      ${step.status === 'processing'
                                        ? 'text-blue-600 font-semibold'
                                        : step.status === 'completed'
                                            ? 'text-green-600'
                                            : 'text-gray-500'}`}>
                                    {step.title}
                                </span>
                            </div>

                            {index < processSteps.length - 1 && (
                                <div className="flex-1 mx-2 h-1 bg-gray-200 rounded-full relative overflow-hidden">
                                    <motion.div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{
                                            width: step.status === 'completed' ? "100%" : "0%"
                                        }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                    />
                                    <motion.div // Progress within the processing step
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                        initial={{ width: "0%" }}
                                        animate={{
                                            width: step.status === 'processing' ? "50%" : "0%" // Simulate 50% progress during processing
                                        }}
                                        transition={{ duration: 0.8, ease: "linear", delay: 0.1 }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProcessStepsBar;
