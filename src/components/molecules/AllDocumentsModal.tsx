import React from 'react';
import Modal from './Modal'; // Assuming Modal.tsx is in the same directory
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { FileText as PdfIcon, CheckSquare, Square } from 'lucide-react';
import { DocumentSource } from '../../types';

interface AllDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: DocumentSource[];
    onDocumentToggle: (id: string) => void;
    // No need for selectAll in this specific modal, parent handles overall state
}

const AllDocumentsModal: React.FC<AllDocumentsModalProps> = ({
    isOpen,
    onClose,
    documents,
    onDocumentToggle,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="전체 문서 목록">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {documents.map(doc => (
                    <Button
                        key={doc.id}
                        variant="outline"
                        onClick={() => onDocumentToggle(doc.id)}
                        className={`flex flex-col items-center justify-center p-3 h-32 rounded-lg text-center
                        ${doc.isChecked ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'}`}
                    >
                        <Icon icon={doc.isChecked ? CheckSquare : Square} size={20}
                            className={`absolute top-2 right-2 ${doc.isChecked ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                        <Icon icon={PdfIcon} size={36} className="mb-2 text-red-500" />
                        <Text as="span" variant="caption" className="truncate w-full">
                            {doc.title}
                        </Text>
                    </Button>
                ))}
                {documents.length === 0 && (
                    <Text variant="body1" className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                        표시할 문서가 없습니다.
                    </Text>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(AllDocumentsModal);
