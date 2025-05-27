import React from 'react';
import { useAtomValue } from 'jotai';
import Modal from './Modal';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';
import { FileText as PdfIcon } from 'lucide-react';
import { DocumentSource, DocsInfo } from '../../types';
import { documentSummaryAtom } from '../../store/atoms';

interface AllDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AllDocumentsModal: React.FC<AllDocumentsModalProps> = ({
    isOpen,
    onClose,
}) => {
    const documentSummary = useAtomValue(documentSummaryAtom);

    const getFileTypeFromName = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') return 'pdf';
        return 'file';
    };

    const documentsToDisplay: DocumentSource[] = React.useMemo(() => {
        const currentDocsInfo = documentSummary?.docs_info || [];
        return currentDocsInfo.map((doc: DocsInfo) => ({
            id: doc.ids,
            title: doc.file,
            type: getFileTypeFromName(doc.file),
        }));
    }, [documentSummary]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="전체 문서 목록">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {documentsToDisplay.map(doc => (
                    <div
                        key={doc.id}
                        className={`flex flex-col items-center justify-center p-3 h-32 rounded-lg text-center border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800`}
                    >
                        <Icon icon={PdfIcon} size={36} className="mb-2 text-red-500" />
                        <Text as="span" variant="caption" className="truncate w-full">
                            {doc.title}
                        </Text>
                    </div>
                ))}
                {documentsToDisplay.length === 0 && (
                    <Text variant="body1" className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                        표시할 문서가 없습니다.
                    </Text>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(AllDocumentsModal);
