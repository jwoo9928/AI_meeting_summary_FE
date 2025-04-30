import React from 'react';
import { AnimatePresence } from 'framer-motion'; // Removed motion
import DocumentListItem from '../molecules/DocumentListItem'; // Import the molecule

// Define Document type (can be moved to a shared types file later)
type Document = {
    id: string;
    title: string;
    date: Date;
    type: string;
    relevanceScore?: number;
};

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
