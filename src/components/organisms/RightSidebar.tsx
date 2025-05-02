import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Share2, FileText } from 'lucide-react';
import DocumentList from './DocumentList'; // Import the DocumentList organism
import { Document } from '../../App'; // Import Document type from App.tsx

// REMOVED local Document type definition

type RightSidebarProps = {
    showDocumentPanel: boolean;
    documents: Document[];
    onReset: () => void;
    getDocumentNodeSize: (score?: number) => number; // Pass the function as a prop
};

const RightSidebar: React.FC<RightSidebarProps> = ({
    showDocumentPanel,
    documents,
    onReset,
    getDocumentNodeSize,
}) => {
    return (
        <motion.div
            initial={{ x: '100%', width: '18rem' }} // Slightly wider sidebar
            animate={{ x: showDocumentPanel ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white border-l border-gray-200 p-4 flex flex-col h-full fixed right-0 top-0 bottom-0 w-72 shadow-lg z-10" // Added shadow
        >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">관련 문서</h2>
                <button
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center border border-gray-200"
                    onClick={onReset} // Use the passed handler
                >
                    <RefreshCw size={14} className="mr-1.5" />
                    <span>초기화</span>
                </button>
            </div>

            {/* Use DocumentList Organism */}
            <DocumentList documents={documents} />

            {/* 3D Document Network Placeholder */}
            <div className="mt-auto border-t border-gray-200 pt-4">
                <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center">
                    <Share2 size={16} className="mr-2 text-purple-500" />
                    문서 네트워크 (3D)
                </h3>
                <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 flex items-center justify-center relative overflow-hidden">
                    {/* Simple 2D representation */}
                    <p className="text-xs text-gray-400 absolute top-2 left-2 z-10">3D 시각화 영역</p>
                    {documents.length > 0 ? (
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            {documents.map((doc, index) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: 0.8,
                                        scale: 1,
                                        x: (Math.random() - 0.5) * 80, // Random position
                                        y: (Math.random() - 0.5) * 50,
                                    }}
                                    transition={{ delay: 0.5 + index * 0.1, type: 'spring', stiffness: 100 }}
                                    className={`absolute rounded-full border-2 border-purple-300 flex items-center justify-center ${doc.type === 'pdf' ? 'bg-red-200' : doc.type === 'docs' ? 'bg-blue-200' : 'bg-gray-200'}`} // Adjusted types based on server example
                                    style={{
                                        width: `${getDocumentNodeSize(doc.score)}px`, // Use score
                                        height: `${getDocumentNodeSize(doc.score)}px`, // Use score
                                    }}
                                    title={`${doc.title} (Score: ${doc.score?.toFixed(2) ?? 'N/A'})`} // Use score
                                >
                                    <FileText size={getDocumentNodeSize(doc.score) * 0.4} className="text-purple-600 opacity-70" />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">문서 없음</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RightSidebar;
