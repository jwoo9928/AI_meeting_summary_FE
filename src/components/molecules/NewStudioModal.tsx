import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import Text from '../atoms/Text'; // If needed for any text inside

interface NewStudioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

const NewStudioModal: React.FC<NewStudioModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [studioName, setStudioName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStudioName(''); // Reset name when modal opens
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (studioName.trim()) {
            onSubmit(studioName.trim());
            onClose(); // Close modal after submission
        } else {
            // Optionally, show an error message or prevent submission
            alert("스튜디오 이름을 입력해주세요.");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="새 스튜디오 생성"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>취소</Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={!studioName.trim()}>생성</Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label htmlFor="studioName" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        스튜디오 이름
                    </label>
                    <input
                        type="text"
                        id="studioName"
                        value={studioName}
                        onChange={(e) => setStudioName(e.target.value)}
                        placeholder="예: 1분기 마케팅 전략"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                    />
                </div>
            </div>
        </Modal>
    );
};

export default React.memo(NewStudioModal);
