import React from 'react';
import { AnimatePresence } from 'framer-motion';
import DocumentListItem from '../molecules/DocumentListItem'; // Import the molecule
import { Document } from '../../App'; // Import Document type from App.tsx

// REMOVED local Document type definition

type DocumentListProps = {
    documents: Document[];
};

const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
    return (
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            <AnimatePresence>
                {documents.map((doc, index) => (
                    <DocumentListItem key={doc.id} doc={doc} index={index} />
                ))}
                {documents.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">관련 문서 없음</p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentList;
