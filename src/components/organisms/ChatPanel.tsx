import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Send, ChevronDown, ChevronRight } from 'lucide-react';
import { useSetAtom } from 'jotai';
import { useMutation } from '@tanstack/react-query';
import { docsInfoAtom } from '../../store/atoms';
import { ProcessDataResponse } from '../../types';
import APIController from '../../controllers/APIController';
import FileUploadOptionsModal from '../molecules/FileUploadOptionsModal'; // Import the modal

interface ChatPanelProps {
    // onFileUpload?: (file: File) => void; // We'll handle upload internally now
    onMessageSend?: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
    onMessageSend
}) => {
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const setDocsInfo = useSetAtom(docsInfoAtom);

    const [summary, setSummary] = useState<string | null>(null);
    const [actionItems, setActionItems] = useState<string[] | null>(null);
    const [isSummaryVisible, setIsSummaryVisible] = useState(true);
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileTypeForModal, setFileTypeForModal] = useState<'audio' | 'pdf' | 'multiple-pdf' | 'other' | undefined>(undefined);

    const processDocumentMutation = useMutation<
        ProcessDataResponse,
        Error,
        { file: File; meeting_info: string; language?: string } // Added language
    >({
        mutationFn: ({ file, meeting_info, language }) => APIController.processDocument(file, meeting_info, language),
        onSuccess: (data) => {
            console.log("File upload success (useMutation):", data);
            setDocsInfo(data.docs_info);
            setSummary(data.summary);
            setActionItems(data.action_items);
            setIsSummaryVisible(true); // Show by default after successful upload
        },
        onError: (error) => {
            console.error("File upload error (useMutation):", error);
            // Clear previous results on error
            setSummary(null);
            setActionItems(null);
            setDocsInfo([]);
        },
    });

    const handleFileSelect = useCallback((file: File) => {
        let type: 'audio' | 'pdf' | 'other' = 'other';
        if (file.type.startsWith('audio/')) {
            type = 'audio';
        } else if (file.type === 'application/pdf') {
            type = 'pdf';
        } else if (file.type.startsWith('text/')) {
            type = 'other'; // Or treat as 'text' if FileUploadOptionsModal handles it
        }

        if (type !== 'other' || file.type.startsWith('text/')) { // Allow text files even if categorized as 'other' for now
            setSelectedFile(file);
            setFileTypeForModal(type);
            setIsOptionsModalOpen(true);
        } else {
            alert('지원하지 않는 파일 형식입니다. PDF, 음성, 텍스트 파일만 업로드 가능합니다.');
            setSelectedFile(null);
            setFileTypeForModal(undefined);
        }
    }, []);

    const handleModalSubmit = (meetingInfoOrConfirmation: string | boolean, language?: string) => {
        if (selectedFile) {
            if (fileTypeForModal === 'pdf' || fileTypeForModal === 'multiple-pdf') {
                if (typeof meetingInfoOrConfirmation === 'boolean' && meetingInfoOrConfirmation === true) {
                    // For PDF, we might have a different API or just log, 
                    // or proceed with the same mutation if it handles PDF summarization etc.
                    // Assuming for now we still want to process it for docs_info, summary, action_items.
                    // The modal for PDF doesn't ask for meeting_info, so we provide a default.
                    console.log(`PDF file "${selectedFile.name}" confirmed for processing.`);
                    processDocumentMutation.mutate({
                        file: selectedFile,
                        meeting_info: `PDF Upload: ${selectedFile.name}`, // Default meeting_info for PDF
                        // language is not typically asked for PDF in this modal, but can be passed if available
                    });
                } else {
                    console.error("PDF confirmation was not true, or type mismatch.");
                }
            } else if (typeof meetingInfoOrConfirmation === 'string') {
                // For audio or other types that require meetingInfo from the modal
                processDocumentMutation.mutate({
                    file: selectedFile,
                    meeting_info: meetingInfoOrConfirmation,
                    language: language,
                });
            } else {
                console.error("Invalid arguments to handleModalSubmit for file type:", fileTypeForModal);
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
        // Reset the input value to allow selecting the same file again to trigger onChange
        if (event.target) {
            event.target.value = '';
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

    const handleMessageSubmit = useCallback(() => {
        if (message.trim()) {
            onMessageSend?.(message.trim());
            setMessage('');
        }
    }, [message, onMessageSend]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleMessageSubmit();
        }
    }, [handleMessageSubmit]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="flex items-center h-10 px-6 bg-white border-b border-gray-200">
                <h1 className="text-base font-semibold text-gray-900">채팅</h1>
            </header>

            {/* Summary and Action Items Section */}
            {processDocumentMutation.isPending && (
                <div className="px-6 py-3 text-center text-blue-600">
                    파일을 처리 중입니다...
                </div>
            )}
            {processDocumentMutation.isError && (
                <div className="px-6 py-3 text-center text-red-600">
                    오류: {processDocumentMutation.error?.message || '알 수 없는 오류가 발생했습니다.'}
                </div>
            )}
            {(summary || actionItems) && !processDocumentMutation.isPending && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                    >
                        <h2 className="text-md font-semibold text-gray-800">
                            {summary ? "요약 및 실행 항목" : "실행 항목"}
                        </h2>
                        {isSummaryVisible ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                    </div>
                    {isSummaryVisible && (
                        <div className="mt-2 space-y-3">
                            {summary && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">요약</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{summary}</p>
                                </div>
                            )}
                            {actionItems && actionItems.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">실행 항목</h3>
                                    <ul className="list-disc list-inside pl-1 space-y-1">
                                        {actionItems.map((item, index) => (
                                            <li key={index} className="text-sm text-gray-600">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Main Content - Conditional rendering for upload prompt */}
            {/* Show upload prompt only if no summary/action items are loaded yet */}
            {!(summary || actionItems) && !processDocumentMutation.isPending && (
                <main className="flex-1 flex flex-col items-center justify-center px-6 py-5">
                    <div className="w-full max-w-2xl space-y-8">
                        {/* Upload Section */}
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
                        </div> {/* This closes "text-center space-y-6" */}
                    </div> {/* This closes "w-full max-w-2xl space-y-8" */}
                </main>
            )}
            {/* If there is summary/action items, provide some padding or a different view for the chat messages area */}
            {(summary || actionItems) && !processDocumentMutation.isPending && (
                <main className="flex-1 px-6 py-5">
                    {/* This area would be for chat messages if they were implemented */}
                    {/* For now, it's an empty space below the summary/action items */}
                </main>
            )}

            {/* File Upload Options Modal */}
            <FileUploadOptionsModal
                isOpen={isOptionsModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                fileName={selectedFile?.name}
                fileType={fileTypeForModal}
                files={selectedFile && (fileTypeForModal === 'pdf' || fileTypeForModal === 'multiple-pdf') ? [{ name: selectedFile.name, type: selectedFile.type }] : undefined}
            />

            {/* Input Section */}
            <div className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="메시지를 입력하세요..."
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={1}
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                        />

                        <button
                            onClick={handleMessageSubmit}
                            disabled={!message.trim()}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ChatPanel);
