import React from 'react';

interface ConfirmationPopupProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isVisible: boolean;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
    title,
    message,
    confirmText = '확인', // Default to 'Confirm' in Korean
    cancelText = '취소', // Default to 'Cancel' in Korean
    onConfirm,
    onCancel,
    isVisible,
}) => {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-opacity-30 flex justify-center items-center z-50 backdrop-blur-sm"> {/* Reduced opacity */}
            <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
                <p className="mb-6 text-gray-600">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationPopup;
