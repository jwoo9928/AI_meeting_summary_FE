import React, { useState, useEffect } from 'react';

interface RecordInfoPopupProps {
    onConfirm: (author: string, participants: string[], purpose: string, title: string, meeting_info: string) => void;
    onCancel: () => void;
    isVisible: boolean;
    confirmButtonText?: string;
    initialTitle?: string; // Keep this if it was used for pre-filling title
}

const RecordInfoPopup: React.FC<RecordInfoPopupProps> = ({
    onConfirm,
    onCancel,
    isVisible,
    confirmButtonText,
    initialTitle, // Keep this if used
}) => {
    const [author, setAuthor] = useState<string>('');
    const [participantsStr, setParticipantsStr] = useState<string>(''); // Comma-separated string
    const [purpose, setPurpose] = useState<string>('');
    const [title, setTitle] = useState<string>(initialTitle || '');
    const [meetingInfo, setMeetingInfo] = useState<string>('');

    useEffect(() => {
        if (isVisible) {
            // Reset fields when popup becomes visible, or prefill if needed
            setTitle(initialTitle || '');
            setAuthor('');
            setParticipantsStr('');
            setPurpose('');
            setMeetingInfo('');
        }
    }, [isVisible, initialTitle]);

    if (!isVisible) {
        return null;
    }

    const handleConfirm = () => {
        const participantsArray = participantsStr.split(',').map(p => p.trim()).filter(p => p.length > 0);
        onConfirm(author, participantsArray, purpose, title, meetingInfo);
    };

    return (
        <div className="fixed inset-0 bg-opacity-30 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl text-left max-w-lg mx-4 w-full overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">회의 정보 입력</h3>

                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="예: 2025년 1분기 실적 발표"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">작성자 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="author"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="예: 홍길동"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">참석자 (쉼표로 구분)</label>
                    <input
                        type="text"
                        id="participants"
                        value={participantsStr}
                        onChange={(e) => setParticipantsStr(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="예: 김철수, 이영희, 박지성"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">회의 목적 <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        id="purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="예: 주간 업무 보고, 신규 프로젝트 기획"
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="meetingInfo" className="block text-sm font-medium text-gray-700 mb-1">추가 정보</label>
                    <textarea
                        id="meetingInfo"
                        value={meetingInfo}
                        onChange={(e) => setMeetingInfo(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="회의 안건, 주요 결정 사항 등 기타 필요한 정보를 입력하세요."
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        disabled={!title.trim() || !author.trim() || !purpose.trim()}
                    >
                        {confirmButtonText || '정보 저장 및 시작'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordInfoPopup;
