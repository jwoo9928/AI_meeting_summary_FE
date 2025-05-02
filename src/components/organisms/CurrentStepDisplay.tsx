import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { ProcessStep } from '../../App'; // Assuming ProcessStep type is exported from App.tsx

interface CurrentStepDisplayProps {
    processingStarted: boolean;
    isRecording: boolean;
    currentStep: number;
    processSteps: ProcessStep[];
    serverStepsLength: number; // Pass the total number of steps
}

const CurrentStepDisplay: React.FC<CurrentStepDisplayProps> = ({
    processingStarted,
    isRecording,
    currentStep,
    processSteps,
    serverStepsLength,
}) => {
    const activeStep = processSteps.find(step => step.id === currentStep);

    return (
        <AnimatePresence>
            {processingStarted && !isRecording && currentStep > 0 && currentStep <= serverStepsLength && activeStep && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                >
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">현재 진행 단계</h2>
                        <div className="flex items-center mb-4">
                            <div
                                className={`flex items-center justify-center w-11 h-11 rounded-full mr-4 text-white
                  ${activeStep.status === 'processing' ? 'bg-blue-500' : 'bg-green-500'}`}
                            >
                                {activeStep.status === 'processing' ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : (
                                    <Check size={22} strokeWidth={3} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                    {activeStep.title}
                                    {activeStep.status === 'processing' && (
                                        <span className="ml-2 text-sm text-blue-600 font-medium animate-pulse">진행 중...</span>
                                    )}
                                    {activeStep.status === 'completed' && (
                                        <span className="ml-2 text-sm text-green-600 font-medium">완료</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {/* Descriptions based on step ID */}
                                    {activeStep.id === 1 && "서버에서 텍스트를 생성하고 있습니다."}
                                    {activeStep.id === 2 && "관련 문서를 검색하고 있습니다."}
                                    {activeStep.id === 3 && "핵심 인사이트를 추출하고 있습니다."}
                                    {activeStep.id === 4 && "추출된 정보로 보고서를 정리하고 있습니다."}
                                    {activeStep.id === 5 && "최종 문서를 화면에 표시(생성)하고 있습니다."}
                                </p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-4">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: `${(processSteps.filter(s => s.status === 'completed').length / serverStepsLength) * 100}%`
                                }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CurrentStepDisplay;
