import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'; // Added Loader2 for progress
import { motion, AnimatePresence } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { processingStatusAtom, documentSummaryAtom, originFileAtom } from '../../store/atoms';
import { DocumentSummary } from '../../types';
import FileUploadOptionsModal from '../molecules/FileUploadOptionsModal';
import { PromptInputWithActions } from '../molecules/PromptInput';
import MessageBasic from '../molecules/ChatSection';

interface ChatPanelProps {
    onFileUpload: (file: File, meeting_info: string, language?: string) => Promise<void>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onFileUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processingStatus = useAtomValue(processingStatusAtom);
    const finalDocumentSummary = useAtomValue(documentSummaryAtom);
    const originFileData = useAtomValue(originFileAtom); // Used to determine if a process has started

    const [isSummaryVisible, setIsSummaryVisible] = useState(true); // For toggling the final summary display
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileTypeForModal, setFileTypeForModal] = useState<'audio' | 'pdf' | 'multiple-pdf' | 'other' | undefined>(undefined);

    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file);
        let type: 'audio' | 'pdf' | 'multiple-pdf' | 'other' = 'other';
        if (file.type.startsWith('audio/')) {
            type = 'audio';
        } else if (file.type === 'application/pdf') {
            type = 'pdf';
        }
        // Add logic for 'multiple-pdf' if needed, or let modal handle it
        setFileTypeForModal(type);
        setIsOptionsModalOpen(true);
    }, []);

    const handleModalSubmit = async (meetingInfoOrConfirmation: string | boolean, language?: string) => {
        if (selectedFile) {
            // Determine meeting_info based on the type of meetingInfoOrConfirmation
            // For PDF, it's a boolean confirmation, so we construct a default meeting_info.
            // For others (audio/text), it's the actual meeting_info string.
            const meetingInfoForAPI = typeof meetingInfoOrConfirmation === 'string'
                ? meetingInfoOrConfirmation
                : `PDF Upload: ${selectedFile.name}`; // Default for PDF if only confirmation is true

            console.log(`File "${selectedFile.name}" confirmed. Meeting Info: "${meetingInfoForAPI}", Language: ${language}`);
            try {
                await onFileUpload(selectedFile, meetingInfoForAPI, language);
                // Status updates are handled by App.tsx via Jotai atoms
            } catch (error) {
                console.error("Error during onFileUpload callback in ChatPanel:", error);
                // App.tsx should also handle this error and update processingStatusAtom
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
        if (file) {
            handleFileSelect(file);
        }
        if (event.target) {
            event.target.value = ''; // Reset input
        }
    }, [handleFileSelect]);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
    }, []);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const renderProcessingStatus = () => {
        // Simple text-based progress. Could be enhanced with icons or more structure.
        // Mimicking GPT/Gemini/Grok style would involve more complex UI elements.
        // For now, a clear message:
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-lg font-semibold text-gray-700">{processingStatus}</p>
                {/* Example of step-by-step, could be driven by more granular status */}
                {/* <div className="mt-4 space-y-2 text-sm text-gray-500">
                    <p>Step 1: Analyzing file... {processingStatus.includes("관련 문서") || processingStatus.includes("문서 요약") || processingStatus.includes("완료") ? "✅" : "⏳"}</p>
                    <p>Step 2: Finding documents... {processingStatus.includes("문서 요약") || processingStatus.includes("완료") ? "✅" : (processingStatus.includes("관련 문서") ? "⏳" : "")}</p>
                    <p>Step 3: Summarizing... {processingStatus.includes("완료") ? "✅" : (processingStatus.includes("문서 요약") ? "⏳" : "")}</p>
                </div> */}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center h-10 px-6 bg-white border-b border-gray-200">
                <h1 className="text-base font-semibold text-gray-900">채팅</h1>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {processingStatus && processingStatus !== "모든 과정 완료!" && (
                    renderProcessingStatus()
                )}

                {!processingStatus && !originFileData && !finalDocumentSummary && (
                    // Initial state: "시작하려면 소스 추가"
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

                {finalDocumentSummary && (processingStatus === "모든 과정 완료!" || !processingStatus) && (
                    // Display summary and action items after completion
                    <>
                        <div className="px-0 py-3 border-b border-gray-200 bg-gray-50 mb-4">
                            <div
                                className="flex justify-between items-center cursor-pointer px-4 py-2"
                                onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                            >
                                <h2 className="text-md font-semibold text-gray-800">
                                    {finalDocumentSummary.summary ? "요약 및 실행 항목" : "실행 항목"}
                                </h2>
                                {isSummaryVisible ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                            </div>
                            <AnimatePresence>
                                {isSummaryVisible && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        style={{ overflow: 'hidden' }}
                                        className="mt-2 space-y-3 px-4 pb-3"
                                    >
                                        {finalDocumentSummary.summary && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-1">요약</h3>
                                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{finalDocumentSummary.summary}</p>
                                            </div>
                                        )}
                                        {finalDocumentSummary.action_items && finalDocumentSummary.action_items.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 mb-1">실행 항목</h3>
                                                <ul className="list-disc list-inside pl-1 space-y-1">
                                                    {finalDocumentSummary.action_items.map((item, index) => (
                                                        <li key={index} className="text-sm text-gray-600">{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="h-full"> {/* Ensure MessageBasic has space if it needs to fill */}
                            <MessageBasic />
                        </div>
                    </>
                )}
            </div>

            <FileUploadOptionsModal
                isOpen={isOptionsModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                fileName={selectedFile?.name}
                fileType={fileTypeForModal}
                files={selectedFile && (fileTypeForModal === 'pdf' || fileTypeForModal === 'multiple-pdf') ? [{ name: selectedFile.name, type: selectedFile.type }] : undefined}
            />

            <PromptInputWithActions />
        </div>
    );
};

export default React.memo(ChatPanel);
