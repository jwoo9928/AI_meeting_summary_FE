import React, { useState, useEffect } from 'react'; // Added useEffect
import { useAtomValue } from 'jotai';
import {
    MoreHorizontal,
    Plus,
    GraduationCap,
    FileText,
    // HelpCircle,
    // TrendingUp
    FileWarning, // For error state
    Loader2, // For loading state
    PanelLeftClose, // For collapse button
    PanelRightClose, // For expand button
} from 'lucide-react';
import { selectedDocIdAtom, docDetailsAtom, docsInfoAtom, fetchedDocInfoIdsAtom, activatedBriefingIdsAtom } from '../../store/atoms'; // Added activatedBriefingIdsAtom
import { useAtom } from 'jotai'; // To use activatedBriefingIdsAtom

interface RightSidebarProps {
    onAddNote?: () => void;
    onShowGuide?: () => void;
    onShowBriefing?: () => void;
    isCollapsed: boolean; // New prop
    onToggleCollapse: () => void; // New prop
    detailDocId: string | null; // New prop for showing detailed view
    onShowDetail: (id: string | null) => void; // New prop to set detailed view
    // onShowFAQ?: () => void; // Assuming FAQ and Timeline are not used based on commented out props
    // onShowTimeline?: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
    onAddNote,
    onShowGuide,
    onShowBriefing,
    isCollapsed,
    onToggleCollapse,
    detailDocId,
    onShowDetail,
}) => {
    const selectedDocId = useAtomValue(selectedDocIdAtom);
    const allDocDetails = useAtomValue(docDetailsAtom);
    const allDocsInfo = useAtomValue(docsInfoAtom); // To get the title
    const fetchedDocInfoIds = useAtomValue(fetchedDocInfoIdsAtom); // To check loading state

    const [activeBriefingDocId, setActiveBriefingDocId] = useState<string | null>(null);
    const [activatedBriefingIds, setActivatedBriefingIds] = useAtom(activatedBriefingIdsAtom);

    const isDocumentSelected = selectedDocId !== null;

    // Effect to sync activeBriefingDocId with selectedDocId if it was previously activated
    useEffect(() => {
        if (selectedDocId && activatedBriefingIds.has(selectedDocId)) {
            setActiveBriefingDocId(selectedDocId);
            // Ensure data is fetched if this doc was activated but maybe not fetched by this session/instance
            // This might be redundant if onShowBriefing in App.tsx handles it well based on fetchedDocInfoIdsAtom
            if (onShowBriefing) {
                onShowBriefing(); // App.tsx's onShowBriefing uses selectedDocId from atom, so it's fine
            }
        } else {
            setActiveBriefingDocId(null); // Clear if not activated or no selection
        }
    }, [selectedDocId, activatedBriefingIds, onShowBriefing]);


    const handleShowBriefingClick = () => {
        if (onShowBriefing) {
            onShowBriefing(); // This will trigger data fetching in App.tsx if needed
        }
        if (selectedDocId) {
            setActivatedBriefingIds(prev => new Set(prev).add(selectedDocId));
            setActiveBriefingDocId(selectedDocId); // This will be set by the useEffect anyway, but explicit set is fine
        }
    };

    const activeDocDetail = activeBriefingDocId ? allDocDetails[activeBriefingDocId] : null;
    const activeDocInfo = activeBriefingDocId ? allDocsInfo.find(doc => doc.ids === activeBriefingDocId) : null;

    // Determine loading state for the active briefing document
    const isLoadingBriefing = activeBriefingDocId && !fetchedDocInfoIds.has(activeBriefingDocId) && isDocumentSelected;

    // When collapsed, clicking the active briefing icon should expand the sidebar
    const handleBriefingIconClick = () => {
        if (isCollapsed) {
            onToggleCollapse(); // Expand sidebar
        }
        // Ensure the briefing remains active, already handled by activeBriefingDocId state
    };

    const detailedViewDocInfo = detailDocId ? allDocsInfo.find(doc => doc.ids === detailDocId) : null;
    const detailedViewDocDetails = detailDocId ? allDocDetails[detailDocId] : null;

    let currentPaddingClass = 'p-4'; // Default for expanded normal view
    if (detailDocId) {
        currentPaddingClass = 'p-6'; // Detail view
    } else if (isCollapsed) {
        currentPaddingClass = 'p-3'; // Collapsed view
    }

    // If detailDocId is set, we are in the "3/5 screen detailed view"
    if (detailDocId && detailedViewDocInfo && detailedViewDocDetails) {
        return (
            <aside className={`w-full h-full bg-white flex flex-col rounded-2xl shadow-xl ${currentPaddingClass}`}>
                {/* Header for Detailed View */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <span>스튜디오</span>
                        <span className="mx-2">{'>'}</span>
                        <span className="text-gray-700 font-medium">메모</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onShowDetail(null)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="닫기">
                            <PanelRightClose className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Title for Detailed View */}
                <h1 className="text-xl font-semibold text-gray-800 mb-1 truncate" title={detailedViewDocInfo.file}>
                    {detailedViewDocInfo.file}
                </h1>
                <p className="text-xs text-gray-500 mb-6">(저장된 대답은 보기 전용입니다.)</p>

                {/* Deep Summary Content */}
                <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
                    <p>{detailedViewDocDetails.deep_summary}</p>
                </div>
            </aside>
        );
    }

    // Normal or Collapsed View
    return (
        <aside className={`w-full h-full bg-white flex flex-col transition-all duration-300 ease-in-out rounded-2xl shadow-xl ${currentPaddingClass}`}>
            {/* Header */}
            {/* Removed px-2 from here for alignment */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center h-10' : 'justify-between h-10 border-b border-gray-200'}`}>
                {!isCollapsed && (
                    // No explicit padding here, relies on parent's p-4 (currentPaddingClass)
                    <h2 className="text-base font-semibold text-gray-900">스튜디오</h2>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <PanelLeftClose className="w-5 h-5" />
                    ) : (
                        <PanelRightClose className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Content */}
            {!isCollapsed ? (
                // The parent 'aside' now has p-4 (currentPaddingClass), so this div doesn't need separate padding control unless specific overrides are needed.
                <div className="flex-1 space-y-6 overflow-y-auto mt-5"> {/* Added mt-5 to match LeftSidebar's header mb-5 */}
                    {/* Notes Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-medium text-gray-900">노트</h3>
                            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* AI Summary Overview Card */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm">🎉</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700 mb-3">
                                        문서의 주요 핵심을 빠르게 파악해 보세요. AI가 문서의 요점을 요약해 드립니다.
                                        <a
                                            href="#"
                                            className="text-blue-600 hover:text-blue-700 ml-1"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Handle "자세히 알아보기" click
                                            }}
                                        >
                                            자세히 알아보기
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Add Note Button */}
                        <button
                            onClick={onAddNote}
                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                <span className="text-sm font-medium text-gray-500 group-hover:text-blue-600">
                                    메모 추가
                                </span>
                            </div>
                        </button>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={onShowGuide}
                                className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="flex items-center space-x-2">
                                    <GraduationCap className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">학습 가이드</span>
                                </div>
                            </button>

                            <button
                                onClick={handleShowBriefingClick}
                                className={`p-3 border rounded-xl transition-colors text-left w-full ${isDocumentSelected
                                    ? 'border-gray-200 hover:bg-gray-50'
                                    : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                                    }`}
                                disabled={!isDocumentSelected}
                            >
                                <div className="flex items-center space-x-2">
                                    <FileText className={`w-4 h-4 ${isDocumentSelected ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-medium ${isDocumentSelected ? 'text-gray-700' : 'text-gray-400'}`}>문서 상세 요약</span>
                                </div>
                            </button>
                        </div>

                        {/* Detailed Briefing Section (Small Preview Item) */}
                        {activeBriefingDocId && ( // This is the small preview item
                            <div className="space-y-3">
                                {isLoadingBriefing ? (
                                    <div className="rounded-lg shadow-sm border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center space-x-3">
                                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                            <span className="text-sm text-gray-500">상세 요약 로딩 중...</span>
                                        </div>
                                    </div>
                                ) : activeDocDetail && activeDocInfo ? (
                                    <div
                                        className="mt-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => onShowDetail(activeBriefingDocId)} // Click to show detailed view
                                        title={`View details for ${activeDocInfo.file}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <FileText className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-800 truncate" title={activeDocInfo.file}>
                                                    {activeDocInfo.file}
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2" title={activeDocDetail.deep_summary}> {/* Keep preview short */}
                                                    {activeDocDetail.deep_summary}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeDocDetail === null && fetchedDocInfoIds.has(activeBriefingDocId) ? (
                                    <div className="rounded-lg shadow-sm border border-red-200 bg-red-50 p-4">
                                        <div className="flex items-center space-x-3">
                                            <FileWarning className="w-5 h-5 text-red-500" />
                                            <span className="text-sm text-red-700">상세 요약 정보를 불러올 수 없습니다.</span>
                                        </div>
                                        {activeDocInfo && <p className="text-xs text-red-600 mt-1">문서: {activeDocInfo.file}</p>}
                                    </div>
                                ) : null
                                }
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Collapsed state (no detail view active)
                // The parent 'aside' already has currentPaddingClass (which would be 'p-3' here).
                // The 'pt-3' and 'space-y-3' should be sufficient for internal spacing.
                <div className="flex-1 flex flex-col items-center pt-3 space-y-3">
                    {/* Add Note Button (Icon only) */}
                    <button
                        onClick={() => { if (onAddNote) onAddNote(); if (isCollapsed) onToggleCollapse(); }}
                        className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                        aria-label="Add new note"
                        title="Add new note"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    {/* Active Briefing Document Icon (if any) */}
                    {activeBriefingDocId && activeDocInfo && (
                        <button
                            onClick={handleBriefingIconClick}
                            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800 w-full flex justify-center"
                            aria-label={`Open detailed summary for ${activeDocInfo.file}`}
                            title={activeDocInfo.file}
                        >
                            <FileText className="w-5 h-5 text-yellow-500" />
                        </button>
                    )}
                </div>
            )}
        </aside>
    );
};

export default React.memo(RightSidebar);
