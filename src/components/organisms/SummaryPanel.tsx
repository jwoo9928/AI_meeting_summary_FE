import React, { useState, useRef, useCallback, useEffect } from 'react';
import { UploadCloud, ChevronDown, ChevronRight, Loader2, FileSearch, FileCheck2, TextSelect } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { processingStatusAtom, processDataResponseAtom } from '../../store/atoms';
import FileUploadOptionsModal from '../molecules/FileUploadOptionsModal';

// --- Placeholder Animation Components ---

const Stage1STTAnimation: React.FC = () => {
    const [lines, setLines] = useState<{ id: number; width: string }[]>([]);
    const lineCounterRef = useRef(0);
    const maxVisibleLines = 7;

    useEffect(() => {
        setLines([]);
        lineCounterRef.current = 0;
        const interval = setInterval(() => {
            const newLine = {
                id: lineCounterRef.current++,
                width: `${Math.floor(Math.random() * 40) + 50}%`
            };
            setLines(prev => {
                const newLines = [...prev, newLine];
                if (newLines.length > maxVisibleLines) {
                    return newLines.slice(newLines.length - maxVisibleLines);
                }
                return newLines;
            });
        }, 600);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full p-3 rounded-lg overflow-hidden flex flex-col justify-end items-center">
            <AnimatePresence initial={false}>
                {lines.map((line) => (
                    <motion.div
                        key={line.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        className="h-5 bg-gray-300 rounded my-1 animate-pulse"
                        style={{ width: line.width }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

const Stage2_RAGSearchAnimation: React.FC = () => {
    const docsPerBatch = 5;
    const [currentBatch, setCurrentBatch] = useState(0);
    const [displayedDocs, setDisplayedDocs] = useState<Array<{ id: number, batch: number }>>([]);
    const docIdCounter = useRef(0);

    useEffect(() => {
        const timers: number[] = [];
        const addDocsForBatch = (batchNumber: number) => {
            for (let i = 0; i < docsPerBatch; i++) {
                timers.push(
                    window.setTimeout(() => {
                        setDisplayedDocs(prev => [...prev, { id: docIdCounter.current++, batch: batchNumber }]);
                    }, (i + 1) * 600)
                );
            }
        };

        addDocsForBatch(currentBatch);

        timers.push(window.setTimeout(() => {
            setDisplayedDocs(prev => prev.filter(doc => doc.batch !== currentBatch));
            setCurrentBatch(prev => prev + 1);
        }, (docsPerBatch + 1) * 600 + 500));

        return () => timers.forEach(clearTimeout);
    }, [currentBatch]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-6 overflow-hidden">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg shadow"
            >
                <FileSearch className="w-8 h-8 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">원본 문서 분석 중...</p>
            </motion.div>

            <div className="flex flex-wrap justify-center items-center gap-3 h-24">
                <AnimatePresence>
                    {displayedDocs.map((doc) => (
                        <motion.div
                            key={doc.id}
                            layout
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                            className="p-3 rounded-lg shadow bg-white flex flex-col items-center space-y-1 w-20"
                        >
                            <FileCheck2 className="w-6 h-6 text-gray-500" />
                            <span className="text-xs text-gray-600">
                                문서
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

const Stage3_SummarizationAnimation: React.FC = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    return 0;
                }
                return prev + 5;
            });
        }, 150);

        return () => clearInterval(interval);
    }, []);

    const numSourceLines = 6;
    const numSummaryLines = 2;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4">
            <TextSelect className="w-10 h-10 text-gray-500 mb-3" />
            <div className="w-full max-w-md space-y-1">
                {[...Array(numSourceLines)].map((_, i) => (
                    <motion.div
                        key={`source-${i}`}
                        className="h-3 bg-gray-300 rounded"
                        style={{ width: `${100 - i * 5}%` }}
                        initial={{ opacity: 0.7 }}
                        animate={{
                            opacity: progress > (i / numSourceLines) * 100 ? 0.3 : 0.7,
                            backgroundColor: progress > (i / numSourceLines) * 100 ? "#e5e7eb" : "#d1d5db",
                        }}
                        transition={{ duration: 0.3 }}
                    />
                ))}
            </div>

            <div className="w-full max-w-xs space-y-1.5 mt-4">
                {[...Array(numSummaryLines)].map((_, i) => (
                    <motion.div
                        key={`summary-${i}`}
                        className="h-4 bg-gray-400 rounded"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{
                            scaleX: progress / 100,
                            opacity: progress > 10 ? 1 : 0
                        }}
                        style={{
                            width: `${80 - i * 10}%`,
                            transformOrigin: "left"
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">요약 진행률: {progress}%</p>
        </div>
    );
};

// --- End Placeholder Animation Components ---

interface SummaryPanelProps {
    onFileUpload: (file: File, meeting_info: string, language?: string) => Promise<void>;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = ({ onFileUpload, isCollapsed, onToggleCollapse }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processingStatus = useAtomValue(processingStatusAtom);
    const processData = useAtomValue(processDataResponseAtom);

    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileTypeForModal, setFileTypeForModal] = useState<'audio' | 'pdf' | 'multiple-pdf' | 'other' | undefined>(undefined);

    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file);
        let type: 'audio' | 'pdf' | 'multiple-pdf' | 'other' = 'other';
        if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type === 'application/pdf') type = 'pdf';
        setFileTypeForModal(type);
        setIsOptionsModalOpen(true);
    }, []);

    const handleModalSubmit = async (meetingInfoOrConfirmation: string | boolean, language?: string) => {
        if (selectedFile) {
            const meetingInfoForAPI = typeof meetingInfoOrConfirmation === 'string'
                ? meetingInfoOrConfirmation
                : `PDF Upload: ${selectedFile.name}`;
            try {
                await onFileUpload(selectedFile, meetingInfoForAPI, language);
            } catch (error) {
                console.error("Error during onFileUpload callback in ChatPanel:", error);
            }
        } else {
            console.error("handleModalSubmit called without a selected file.");
        }
        setSelectedFile(null);
        setFileTypeForModal(undefined);
        setIsOptionsModalOpen(false);
    };

    const handleModalClose = () => {
        setSelectedFile(null);
        setFileTypeForModal(undefined);
        setIsOptionsModalOpen(false);
    };

    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) handleFileSelect(file);
        if (event.target) event.target.value = '';
    }, [handleFileSelect]);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((event: React.DragEvent) => event.preventDefault(), []);
    const handleUploadClick = useCallback(() => fileInputRef.current?.click(), []);

    const renderProcessingStatus = () => {
        let animationComponent;
        switch (processingStatus) {
            case "파일 처리 중...":
                animationComponent = <Stage1STTAnimation />;
                break;
            case "데이터 분석 중...":
                animationComponent = <Stage2_RAGSearchAnimation />;
                break;
            case "문서 요약 중...":
                animationComponent = <Stage3_SummarizationAnimation />;
                break;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <p className="text-lg font-semibold text-gray-700">{processingStatus}</p>
                    </div>
                );
        }

        return (
            <>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <p className="mt-2 text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow">
                        {processingStatus}
                    </p>
                </div>
                <div className="w-full h-full flex items-center justify-center">
                    {animationComponent}
                </div>
            </>
        );
    };

    // Extract summary and action_items for display
    const summaryToDisplay = processData?.summary;
    const actionItemsToDisplay = processData?.action_items;

    return (
        <div className="flex flex-col h-full">
            {/* 고정된 헤더 */}
            <header className={`flex items-center h-14 px-6 bg-white flex-shrink-0 border-b border-gray-200 ${isCollapsed ? 'rounded-2xl' : 'rounded-t-2xl'}`}>
                <h1 className="text-base font-semibold text-gray-900 mt-4">보고서</h1>
                <button
                    onClick={onToggleCollapse}
                    className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label={isCollapsed ? "Expand Summary Panel" : "Collapse Summary Panel"}
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                </button>
            </header>

            {/* 접힐 수 있는 콘텐츠 영역 */}
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={`flex-1 overflow-y-auto relative bg-white rounded-b-2xl ${processingStatus && processingStatus !== "모든 과정 완료!" && !processingStatus.startsWith("오류 발생:") ? "" : "px-6 py-5"}`}
                    >
                        {processingStatus && processingStatus !== "모든 과정 완료!" && !processingStatus.startsWith("오류 발생:") && (
                            renderProcessingStatus()
                        )}
                        {processingStatus && processingStatus.startsWith("오류 발생:") && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center px-6 py-5">
                                <p className="text-lg font-semibold text-red-600">{processingStatus}</p>
                            </div>
                        )}

                        {!processingStatus && !processData?.origin_file && !processData && (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-full max-w-2xl space-y-8">
                                    <div className="text-center space-y-6">
                                        <div
                                            className="relative border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors cursor-pointer bg-white"
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onClick={handleUploadClick}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                onChange={handleFileInputChange}
                                                accept="audio/*,text/*,.pdf"
                                            />
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <UploadCloud className="w-8 h-8 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                                                        시작하려면 소스 추가
                                                    </h2>
                                                    <p className="text-sm text-gray-500">
                                                        파일을 드래그하여 놓거나 클릭하여 업로드하세요 (PDF, 음성, 텍스트)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {processData && (processingStatus === "모든 과정 완료!" || (!processingStatus && processData.origin_file)) && (
                            <>
                                {summaryToDisplay && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-1">요약</h3>
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{summaryToDisplay}</p>
                                    </div>
                                )}
                                {actionItemsToDisplay && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-700 mb-1">실행 항목</h3>
                                        <ul className="list-disc list-inside pl-1 space-y-1">
                                            <div className="text-sm text-gray-600">{actionItemsToDisplay}</div>
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <FileUploadOptionsModal
                isOpen={isOptionsModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                fileName={selectedFile?.name}
                fileType={fileTypeForModal}
                files={selectedFile && (fileTypeForModal === 'pdf' || fileTypeForModal === 'multiple-pdf') ? [{ name: selectedFile.name, type: selectedFile.type }] : undefined}
            />
        </div>
    );
};

export default SummaryPanel;