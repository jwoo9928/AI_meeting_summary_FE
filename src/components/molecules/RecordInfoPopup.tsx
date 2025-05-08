import React, { useState } from 'react';

interface RecordInfoPopupProps {
    onConfirm: (participants: number, purpose: string, title: string) => void;
    onCancel: () => void;
    isVisible: boolean;
}

const RecordInfoPopup: React.FC<RecordInfoPopupProps> = ({
    onConfirm,
    onCancel,
    isVisible,
}) => {
    const [participants, setParticipants] = useState<number>(1);
    const [purpose, setPurpose] = useState<string>('');
    const [title, setTitle] = useState<string>('');

    if (!isVisible) {
        return null;
    }

    const handleConfirm = () => {
        onConfirm(participants, purpose, title);
    };

    return (
        <div className="fixed inset-0 bg-opacity-30 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl text-left max-w-md mx-4 w-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">녹음 정보 입력</h3>

                <div className="mb-4">
                    <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">참석자 인원수</label>
                    <input
                        type="number"
                        id="participants"
                        value={participants}
                        onChange={(e) => setParticipants(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        min="1"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">목적</label>
                    <input
                        type="text"
                        id="purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="예: 주간 회의, 고객 인터뷰"
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="예: 2025년 1분기 실적 발표"
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
                        disabled={!purpose.trim() || !title.trim()}
                    >
                        녹음 시작
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecordInfoPopup;
