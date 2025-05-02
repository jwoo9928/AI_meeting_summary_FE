import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Document } from '../../App'; // Import Document type from App.tsx

// REMOVED local Document type definition

type DocumentListItemProps = {
    doc: Document;
    index: number; // For animation delay
};

const DocumentListItem: React.FC<DocumentListItemProps> = ({ doc, index }) => {
    // Function to get colors based on keywords in the title, matching the image
    const getStyleByTypeKeywords = (type: string): { bg: string; text: string } => {
        const lowerTitle = type?.toLowerCase() || '';
        if (lowerTitle.includes('pdf')) {
            return { bg: 'bg-red-50', text: 'text-red-500' }; // Red for "마케팅"
        } else if (lowerTitle.includes('docs')) {
            return { bg: 'bg-blue-50', text: 'text-blue-500' }; // Blue for "제품"
        } else if (lowerTitle.includes('excel')) {
            return { bg: 'bg-green-50', text: 'text-green-500' }; // Green for "예산"
        } else if (lowerTitle.includes('txt')) {
            return { bg: 'bg-gray-100', text: 'text-gray-500' }; // Gray for "경쟁사"
        } else {
            // Fallback based on extension if no keyword matches? Or just default gray? Let's default to gray.
            // We could add extension logic here as a secondary check if needed.
            return { bg: 'bg-gray-100', text: 'text-gray-500' }; // Default Gray
        }
    };

    const colors = getStyleByTypeKeywords(doc.type);

    return (
        <motion.div
            key={doc.id}
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="rounded-xl p-3 bg-white hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer shadow-sm"
        >
            <div className="flex items-center space-x-3">
                {/* Apply dynamic background and icon color based on type */}
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <FileText size={18} className={colors.text} />
                </div>
                {/* Add min-w-0 to allow truncation within flex container */}
                <div className="flex-1 min-w-0">
                    {/* Display title and type separately for targeted truncation */}
                    <h3 className="font-medium text-gray-800 text-sm flex"> {/* Use flex to keep spans inline */}
                        <span className="truncate">{doc.title}</span>
                        {/* Append type, ensuring it's not truncated */}
                        {doc.type && <span className="flex-shrink-0">.{doc.type}</span>}
                    </h3>
                    {/* Conditionally render date */}
                    {doc.date && (
                        <p className="text-xs text-gray-500 mt-0.5">{format(doc.date, 'yyyy.MM.dd', { locale: ko })}</p>
                    )}
                </div>
                {/* Score Indicator - Use score instead of relevanceScore */}
                {doc.score !== undefined && ( // Check if score exists using !== undefined
                    <div className="flex flex-col items-center ml-2">
                        {/* Display score as rounded whole number */}
                        <div className="text-sm font-semibold text-blue-600">{Math.round(doc.score)}</div>
                        {/* Assume score is 0-100 for progress bar width */}
                        <div className="w-10 h-1.5 bg-gray-200 rounded-full mt-1"> {/* Slightly larger bar */}
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(Math.max(doc.score || 0, 0), 100)}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default DocumentListItem;
