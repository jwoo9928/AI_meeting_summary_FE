import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square } from 'lucide-react';

// Define the available document types
export const DOCUMENT_TYPES = [
    { id: 'summary', label: '요약' },
    { id: 'todo', label: '투두리스트' },
    { id: 'tech_report', label: '기술보고서' },
    { id: 'meeting_report', label: '회의보고서' },
];

interface DocumentTypeSelectionPopupProps {
    isVisible: boolean;
    selectedTypes: string[];
    onSelectionChange: (typeId: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

const DocumentTypeSelectionPopup: React.FC<DocumentTypeSelectionPopupProps> = ({
    isVisible,
    selectedTypes,
    onSelectionChange,
    onConfirm,
    onCancel,
}) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">생성할 문서 종류 선택</h2>
                        <div className="space-y-3 mb-6">
                            {DOCUMENT_TYPES.map((docType) => (
                                <label
                                    key={docType.id}
                                    className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-100 transition-colors"
                                    onClick={(e) => {
                                        // Prevent label click from triggering twice on checkbox
                                        if (e.target !== e.currentTarget) return;
                                        onSelectionChange(docType.id);
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedTypes.includes(docType.id)}
                                        onChange={() => onSelectionChange(docType.id)}
                                        className="hidden" // Hide default checkbox
                                    />
                                    {selectedTypes.includes(docType.id) ? (
                                        <CheckSquare size={20} className="text-blue-600" />
                                    ) : (
                                        <Square size={20} className="text-gray-400" />
                                    )}
                                    <span className="text-gray-700">{docType.label}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                취소
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={selectedTypes.length === 0} // Disable if nothing selected
                                className={`px-4 py-2 rounded text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedTypes.length > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                                    : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                생성 시작
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DocumentTypeSelectionPopup;
