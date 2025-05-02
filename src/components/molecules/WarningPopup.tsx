import React from 'react';

interface WarningPopupProps {
    message: string;
    onClose: () => void;
    isVisible: boolean;
}

const WarningPopup: React.FC<WarningPopupProps> = ({ message, onClose, isVisible }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-opacity-30 flex justify-center items-center z-50 backdrop-blur-sm"> {/* Reduced opacity */}
            <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm">
                <h3 className="text-lg font-semibold text-yellow-500 mb-2">Warning</h3>
                <p className="mb-4">{message}</p>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default WarningPopup;
