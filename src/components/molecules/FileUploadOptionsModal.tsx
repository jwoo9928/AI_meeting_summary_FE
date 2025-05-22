import React, { useState, useEffect } from 'react';
import Modal from './Modal';
// import Button from '../atoms/Button'; // No longer used
import Icon from '../atoms/Icon';
import { FileAudio, FileText } from 'lucide-react'; // Added FileAudio and FileText for icons

interface FileUploadOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (meetingInfoOrConfirmation: string | boolean, language?: string) => void; // Modified onSubmit
    fileName?: string;
    fileType?: 'audio' | 'pdf' | 'multiple-pdf' | 'other';
    files?: { name: string; type: string }[]; // For multiple PDF display
}

const FileUploadOptionsModal: React.FC<FileUploadOptionsModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    fileName,
    fileType,
    files,
}) => {
    const [meetingInfo, setMeetingInfo] = useState('');
    const [language, setLanguage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset form when modal opens or closes
        if (isOpen) {
            setMeetingInfo('');
            setLanguage('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (fileType === 'pdf' || fileType === 'multiple-pdf') {
            // For PDF, onSubmit is a confirmation (true)
            onSubmit(true);
        } else {
            // For audio or other types that require meetingInfo
            if (!meetingInfo.trim()) {
                setError('회의 정보는 필수입니다.');
                return;
            }
            onSubmit(meetingInfo, language.trim() || undefined);
        }
        onClose();
    };

    const modalTitle = 'Upload';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            footer={
                <div className="flex justify-end w-full space-x-2">
                    {/* Applying exact LeftSidebar button styling */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                    >
                        <span className="text-sm font-medium text-gray-800">취소</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                    >
                        <span className="text-sm font-medium text-gray-800">
                            {fileType === 'pdf' || fileType === 'multiple-pdf' ? '확인' : '업로드 확인'}
                        </span>
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {fileType === 'audio' && fileName && (
                    <div className="flex items-center p-3 rounded-lg shadow-sm border border-gray-200 bg-white">
                        <Icon icon={FileAudio} className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate flex-1">{fileName}</span>
                    </div>
                )}

                {(fileType === 'pdf' || fileType === 'multiple-pdf') && files && files.length > 0 && (
                    <>
                        <p className="text-sm text-gray-700 mb-2">다음 파일들을 업로드하시겠습니까?</p>
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center p-2.5 rounded-md border border-gray-200 bg-gray-50">
                                    <Icon icon={FileText} className="w-5 h-5 text-red-500 mr-2.5 flex-shrink-0" />
                                    <span className="text-xs text-gray-800 truncate">{file.name}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Inputs for meeting info and language - shown for audio and 'other', hidden for PDF types */}
                {(fileType === 'audio' || fileType === 'other' || !fileType) && (
                    <>
                        <div>
                            <label htmlFor="meetingInfo" className="block text-sm font-medium text-gray-700 mb-1">
                                회의 정보 (필수)
                            </label>
                            <input
                                type="text"
                                id="meetingInfo"
                                value={meetingInfo}
                                onChange={(e) => {
                                    setMeetingInfo(e.target.value);
                                    if (error && e.target.value.trim()) {
                                        setError('');
                                    }
                                }}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="예: 주간 팀 회의록"
                            />
                            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                        </div>
                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                                언어 (선택 사항)
                            </label>
                            <input
                                type="text"
                                id="language"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="예: ko, en"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                음성 파일의 경우, 언어를 지정하지 않으면 자동 감지됩니다.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(FileUploadOptionsModal);
