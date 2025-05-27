import React, { useState, useEffect, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import Modal from './Modal';
import Button from '../atoms/Button';
import APIController from '../../controllers/APIController';
import { processDataResponseAtom } from '../../store/atoms'; // Changed atom
import { ProcessDataResponse } from '../../types'; // DocumentSummary, OriginFile might not be needed directly

interface NewStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewStudioModal: React.FC<NewStudioModalProps> = ({ isOpen, onClose }) => {
    const [studioName, setStudioName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const setProcessDataResponse = useSetAtom(processDataResponseAtom); // Changed setter

    useEffect(() => {
        if (isOpen) {
            setStudioName('');
            setSelectedFile(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!studioName.trim()) {
            alert("스튜디오 이름을 입력해주세요.");
            return;
        }
        if (!selectedFile) {
            alert("파일을 선택해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            // APIController.processDocument now returns ProcessDataResponse which includes origin_file
            const responseData: ProcessDataResponse = await APIController.processDocument(selectedFile, studioName.trim());

            // The responseData already contains origin_file correctly populated by the APIController (or backend)
            // No need to manually construct originFile here if APIController's dummy/actual response is correct.
            // The ProcessDataResponse type includes origin_file, docs_info, summary, action_items.

            setProcessDataResponse(responseData); // Set the entire response
            onClose();
        } catch (error) {
            console.error("Error processing document:", error);
            alert(`문서 처리 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [studioName, selectedFile, onClose, setProcessDataResponse]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="새 스튜디오 생성"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>취소</Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!studioName.trim() || !selectedFile || isSubmitting}
                    >
                        {isSubmitting ? "생성 중..." : "생성"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="studioName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        스튜디오 이름 (회의 정보)
                    </label>
                    <input
                        type="text"
                        id="studioName"
                        value={studioName}
                        onChange={(e) => setStudioName(e.target.value)}
                        placeholder="예: 1분기 마케팅 전략"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                        disabled={isSubmitting}
                    />
                </div>
                <div>
                    <label htmlFor="fileUpload" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        문서 파일
                    </label>
                    <input
                        type="file"
                        id="fileUpload"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 dark:text-gray-400
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-md file:border-0
                                   file:text-sm file:font-semibold
                                   file:bg-blue-50 file:text-blue-700
                                   hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-blue-300 dark:hover:file:bg-gray-600"
                        disabled={isSubmitting}
                    />
                    {selectedFile && <p className="text-xs text-gray-500 mt-1">선택된 파일: {selectedFile.name}</p>}
                </div>
            </div>
        </Modal>
    );
};

export default React.memo(NewStudioModal);
