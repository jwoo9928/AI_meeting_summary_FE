import React, { useEffect, useState } from 'react'; // Added useState
import { Plus, Search, PanelLeftClose, PanelRightClose, FileText, ChevronDown, Diamond } from 'lucide-react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { DocumentSource, DocsInfo } from '../../types'; // Changed DocInfo to DocsInfo
import { selectedDocIdAtom, documentSummaryAtom, fetchedDocInfoIdsAtom, docSummariesAtom } from '../../store/atoms'; // Changed docsInfoAtom to documentSummaryAtom
import APIController from '../../controllers/APIController';
import NewStudioModal from '../molecules/NewStudioModal'; // Import NewStudioModal

interface SourceItemProps {
    source: DocumentSource;
    isSelected: boolean; // For checkbox state
    isExpanded: boolean; // For summary visibility
    onSelect: (id: string) => void; // For checkbox click
    onToggleExpand: (id: string) => void; // For item click to expand/collapse summary
}

const SourceItem: React.FC<SourceItemProps> = React.memo(({ source, isSelected, isExpanded, onSelect, onToggleExpand }) => {
    const isPdf = source.type === 'pdf' || source.title.toLowerCase().includes('.pdf');
    const [fetchedDocInfoIds, setFetchedDocInfoIds] = useAtom(fetchedDocInfoIdsAtom);
    const setDocSummaries = useSetAtom(docSummariesAtom);

    useEffect(() => {
        const fetchDocInfo = async () => {
            if (isExpanded && source.id && !fetchedDocInfoIds.has(source.id)) {
                try {
                    const responseData = await APIController.getDocumentInfo(source.id);
                    const docDetail = responseData[source.id];
                    if (docDetail && docDetail.summary) {
                        setDocSummaries(prev => ({ ...prev, [source.id]: docDetail.summary }));
                    } else {
                        console.warn(`LeftSidebar: Summary not found for ${source.id} in API response.`);
                        setDocSummaries(prev => ({ ...prev, [source.id]: "요약 정보를 찾을 수 없습니다." }));
                    }
                    setFetchedDocInfoIds(prev => {
                        const newSet = new Set(prev);
                        newSet.add(source.id);
                        return newSet;
                    });
                } catch (error) {
                    console.error(`LeftSidebar: Failed to fetch summary for ${source.id}:`, error);
                    setDocSummaries(prev => ({ ...prev, [source.id]: "요약 정보를 불러오는데 실패했습니다." }));
                }
            }
        };

        if (isExpanded && source.id) {
            fetchDocInfo();
        }
    }, [isExpanded, source.id, fetchedDocInfoIds, setFetchedDocInfoIds, setDocSummaries]);

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent item expansion when checkbox is clicked
        onSelect(source.id);
    };

    const handleItemClick = () => {
        onToggleExpand(source.id);
    };

    return (
        <div className={`rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ease-in-out ${isExpanded ? 'bg-blue-50' : 'bg-white'}`}>
            {/* Clickable header part */}
            <div
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors duration-150 ${isExpanded ? 'rounded-t-lg' : 'rounded-lg'} ${!isExpanded && isSelected ? 'bg-gray-100' : !isExpanded ? 'hover:bg-gray-50' : ''
                    }`}
                onClick={handleItemClick}
            >
                {/* Checkbox area */}
                <div
                    onClick={handleCheckboxClick}
                    className={`w-5 h-5 border rounded flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 hover:bg-blue-700' : 'border-gray-300 hover:bg-gray-200'
                        }`}
                    aria-label={`Select document ${source.title}`}
                >
                    {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </div>

                {/* PDF Icon */}
                {isPdf && (
                    <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">PDF</span>
                    </div>
                )}

                {/* Title */}
                <span className="text-sm text-gray-900 truncate flex-1">
                    {source.title}
                </span>

                {/* Chevron for expansion indication */}
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''
                        }`}
                />
            </div>

            {/* Expanded Summary Section */}
            {isExpanded && (
                <div className="p-4 bg-blue-50 rounded-b-lg border-t border-blue-200"> {/* Using bg-blue-50 for a very light blue */}
                    <div className="flex items-center mb-2">
                        <Diamond className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" /> {/* Lucide Diamond icon */}
                        <h4 className="text-sm font-semibold text-blue-700">소스 가이드</h4>
                    </div>
                    <div className="pl-[22px]"> {/* Indent summary content to align with text after icon */}
                        <h5 className="text-xs font-semibold text-gray-800 mb-1">요약</h5>
                        <p className="text-xs text-gray-700 leading-relaxed">
                            {source.summary || (isExpanded && source.id && !fetchedDocInfoIds.has(source.id) ? "요약 정보 로딩 중..." : "요약 정보가 없습니다.")}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

interface LeftSidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    expandedDocId: string | null;
    onToggleExpand: (id: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
    isCollapsed,
    onToggleCollapse,
    expandedDocId,
    onToggleExpand
}) => {
    const [selectedDocId, setSelectedDocId] = useAtom(selectedDocIdAtom);
    const documentSummary = useAtomValue(documentSummaryAtom);
    const docSummaries = useAtomValue(docSummariesAtom);
    const [isNewStudioModalOpen, setIsNewStudioModalOpen] = useState(false); // State for NewStudioModal

    const handleSelectSource = (id: string) => {
        setSelectedDocId(prevId => (prevId === id ? null : id));
    };

    const getFileTypeFromName = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension === 'pdf') return 'pdf';
        if (['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
        if (['txt', 'doc', 'docx'].includes(extension || '')) return 'text';
        return 'file'; // Default type
    };

    const allDocumentSources: DocumentSource[] = React.useMemo(() => {
        const currentDocsInfo = documentSummary?.docs_info || [];
        return currentDocsInfo.length > 0
            ? currentDocsInfo.map((doc: DocsInfo) => ({
                id: doc.ids,
                title: doc.file,
                type: getFileTypeFromName(doc.file),
                summary: docSummaries[doc.ids] || '',
            }))
            : [];
    }, [documentSummary, docSummaries]);

    const itemsToRenderInList = React.useMemo(() => {
        if (!expandedDocId) {
            return allDocumentSources; // Return all sources if nothing is expanded
        }

        const currentExpandedItem = allDocumentSources.find(s => s.id === expandedDocId);

        if (!currentExpandedItem) {
            return allDocumentSources; // Fallback if expanded item not found
        }

        return [currentExpandedItem]; // Only the expanded item
    }, [allDocumentSources, expandedDocId]);

    const sidebarWidthClass = isCollapsed
        ? 'w-[72px] p-3'
        : expandedDocId
            ? 'w-[40vw] p-4'
            : 'w-80 p-4';

    return (
        <>
            <aside className={`h-full flex flex-col bg-white transition-all duration-300 ease-in-out shadow-xl rounded-2xl ${sidebarWidthClass}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center h-10 mb-3' : 'justify-between mb-5 h-10 border-b border-gray-200'}`}>
                    {!isCollapsed && (
                        <h2 className="text-base font-semibold text-gray-900">출처</h2>
                    )}
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? (
                            <PanelRightClose className="w-5 h-5" />
                        ) : (
                            <PanelLeftClose className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {!isCollapsed ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            <button
                                onClick={() => setIsNewStudioModalOpen(true)} // Open modal
                                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                            >
                                <Plus className="w-4 h-4 text-gray-700" />
                                <span className="text-sm font-medium text-gray-800">추가</span>
                            </button>
                            <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white">
                                <Search className="w-4 h-4 text-gray-700" />
                                <span className="text-sm font-medium text-gray-800">탐색</span>
                            </button>
                        </div>

                        {/* Sources List */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                            {itemsToRenderInList.length > 0 ? (
                                <div className="space-y-2">
                                    {itemsToRenderInList.map((source) => (
                                        <SourceItem
                                            key={source.id}
                                            source={source}
                                            isSelected={selectedDocId === source.id}
                                            onSelect={handleSelectSource}
                                            isExpanded={expandedDocId === source.id}
                                            onToggleExpand={onToggleExpand}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center pt-10 pb-4">
                                    <FileText className="w-10 h-10 text-gray-400 mb-3" />
                                    <h3 className="text-sm font-semibold text-gray-700 mb-1.5">
                                        저장된 소스가 여기에 표시됩니다
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-snug max-w-[220px]">
                                        위의 소스 추가를 클릭하여 PDF, 웹사이트, 텍스트, 동영상 또는 오디오 파일을 추가하세요. 또는 Google Drive에서 파일을 직접 가져올 수 있습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Collapsed state
                    <div className="flex-1 flex flex-col items-center pt-3 space-y-3">
                        <button
                            onClick={() => setIsNewStudioModalOpen(true)} // Open modal
                            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                            aria-label="Add new source"
                            title="Add new source"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        {allDocumentSources.map(source => {
                            const isPdf = source.type === 'pdf' || source.title.toLowerCase().includes('.pdf');
                            const handleIconClick = () => {
                                if (isCollapsed) {
                                    onToggleCollapse();
                                }
                                onToggleExpand(source.id);
                            };
                            return (
                                <button
                                    key={source.id}
                                    onClick={handleIconClick}
                                    className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800 w-full flex justify-center"
                                    aria-label={`Open ${source.title}`}
                                    title={source.title}
                                >
                                    {isPdf ? (
                                        <div className="w-5 h-5 bg-red-500 rounded-sm flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-[10px] font-bold">PDF</span>
                                        </div>
                                    ) : (
                                        <FileText className="w-5 h-5" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </aside>
            <NewStudioModal
                isOpen={isNewStudioModalOpen}
                onClose={() => setIsNewStudioModalOpen(false)}
            />
        </>
    );
};

export default React.memo(LeftSidebar);
