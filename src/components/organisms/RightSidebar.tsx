import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useAtomValue, useSetAtom } from 'jotai'; // Added useSetAtom
import {
    MoreHorizontal,
    Plus,
    GraduationCap,
    FileText,
    FileWarning,
    Loader2,
    PanelLeftClose,
    PanelRightClose,
} from 'lucide-react';
import { selectedDocIdAtom, docDetailsAtom, findDocsResponseAtom, fetchedDocInfoIdsAtom, activatedBriefingIdsAtom, docSummariesAtom, rightSidebarDetailDocIdAtom } from '../../store/atoms'; // Use findDocsResponseAtom
import { useAtom } from 'jotai';
import APIController from '../../controllers/APIController';
import { DocsInfo } from '../../types'; // Import DocsInfo

interface RightSidebarProps {
    onAddNote?: () => void;
    onShowGuide?: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    // detailDocId and onShowDetail props removed
}

const RightSidebar: React.FC<RightSidebarProps> = ({
    onAddNote,
    onShowGuide,
    isCollapsed,
    onToggleCollapse,
}) => {
    const [detailDocId, setDetailDocId] = useAtom(rightSidebarDetailDocIdAtom);
    const selectedDocId = useAtomValue(selectedDocIdAtom);
    const allDocDetails = useAtomValue(docDetailsAtom);
    const findDocsResponse = useAtomValue(findDocsResponseAtom); // Use findDocsResponseAtom
    const currentDocsInfo: DocsInfo[] = findDocsResponse?.docs_info || []; // Derive docs_info and type it
    const fetchedDocInfoIds = useAtomValue(fetchedDocInfoIdsAtom);

    const setDocDetails = useSetAtom(docDetailsAtom);
    const setDocSummaries = useSetAtom(docSummariesAtom);
    const setFetchedDocInfoIds = useSetAtom(fetchedDocInfoIdsAtom);
    const [activatedBriefingIds, setActivatedBriefingIds] = useAtom(activatedBriefingIdsAtom);
    const [activeBriefingDocId, setActiveBriefingDocId] = useState<string | null>(null);

    const isDocumentSelected = selectedDocId !== null;

    useEffect(() => {
        if (selectedDocId && activatedBriefingIds.has(selectedDocId)) {
            setActiveBriefingDocId(selectedDocId);
        } else {
            setActiveBriefingDocId(null);
        }
    }, [selectedDocId, activatedBriefingIds]);

    const handleShowBriefingClick = useCallback(async () => {
        if (!selectedDocId) {
            console.log("RightSidebar: No document selected for briefing.");
            return;
        }
        console.log("RightSidebar: handleShowBriefingClick called with selectedDocId:", selectedDocId);

        setActivatedBriefingIds(prev => {
            const newSet = new Set(prev);
            newSet.add(selectedDocId);
            console.log("RightSidebar: updated activatedBriefingIds:", newSet);
            return newSet;
        });
        setActiveBriefingDocId(selectedDocId);
        // Add console log immediately after setting activeBriefingDocId in the handler
        console.log("RightSidebar: activeBriefingDocId set in handleShowBriefingClick to:", selectedDocId);


        if (!fetchedDocInfoIds.has(selectedDocId)) {
            try {
                console.log(`RightSidebar: Fetching details for ${selectedDocId}`);
                const responseData = await APIController.getDocumentInfo(selectedDocId);
                const docDetail = responseData[selectedDocId];

                if (docDetail) {
                    setDocDetails(prev => ({ ...prev, [selectedDocId]: docDetail }));
                    if (docDetail.summary) {
                        setDocSummaries(prev => ({ ...prev, [selectedDocId]: docDetail.summary }));
                    } else {
                        setDocSummaries(prev => ({ ...prev, [selectedDocId]: "요약 정보 없음" }));
                    }
                } else {
                    console.warn(`RightSidebar: Document detail not found for ${selectedDocId}.`);
                    setDocDetails(prev => ({ ...prev, [selectedDocId]: null }));
                    setDocSummaries(prev => ({ ...prev, [selectedDocId]: "상세 정보를 찾을 수 없습니다." }));
                }
                setFetchedDocInfoIds(prev => new Set(prev).add(selectedDocId));
            } catch (error) {
                console.error(`RightSidebar: Failed to fetch document detail for ${selectedDocId}:`, error);
                setDocDetails(prev => ({ ...prev, [selectedDocId]: null }));
                setDocSummaries(prev => ({ ...prev, [selectedDocId]: "상세 정보 로딩 실패." }));
                setFetchedDocInfoIds(prev => new Set(prev).add(selectedDocId));
            }
        } else {
            console.log(`RightSidebar: Details for ${selectedDocId} already fetched.`);
        }
    }, [selectedDocId, fetchedDocInfoIds, setActivatedBriefingIds, setDocDetails, setDocSummaries, setFetchedDocInfoIds]);

    const activeDocDetail = activeBriefingDocId ? allDocDetails[activeBriefingDocId] : null;
    const activeDocInfo = activeBriefingDocId ? currentDocsInfo.find((doc: DocsInfo) => doc.ids === activeBriefingDocId) : null;

    const isLoadingBriefing = activeBriefingDocId && !fetchedDocInfoIds.has(activeBriefingDocId) && isDocumentSelected && activatedBriefingIds.has(activeBriefingDocId);

    console.log("RightSidebar render states:", {
        selectedDocId,
        activeBriefingDocId,
        isDocumentSelected,
        isLoadingBriefing,
        activatedBriefingIds: Array.from(activatedBriefingIds), // Set to Array for logging
        fetchedDocInfoIds: Array.from(fetchedDocInfoIds),   // Set to Array for logging
        activeDocInfo,
        activeDocDetail
    });


    const handleBriefingIconClick = () => {
        if (isCollapsed) {
            onToggleCollapse();
        }
    };

    const detailedViewDocInfo = detailDocId ? currentDocsInfo.find((doc: DocsInfo) => doc.ids === detailDocId) : null;
    const detailedViewDocDetails = detailDocId ? allDocDetails[detailDocId] : null;

    // Determine padding based on collapsed state or detail view state
    let currentPaddingClass = 'p-4';
    if (isCollapsed) {
        currentPaddingClass = 'p-3';
    } else if (detailDocId) {
        currentPaddingClass = 'p-6';
    }
    // asideWidthClass is controlled by App.tsx via its container div.
    // RightSidebar's aside should fill its container.

    // Effect to close detail view if the main selectedDocId changes and is different, or if no doc is selected
    useEffect(() => {
        if (detailDocId && selectedDocId !== detailDocId) {
            setDetailDocId(null);
        }
        if (!selectedDocId && detailDocId) {
            setDetailDocId(null);
        }
    }, [selectedDocId, detailDocId]);


    if (detailDocId && detailedViewDocInfo && detailedViewDocDetails) {
        return (
            <aside className={`w-full h-full bg-white flex flex-col rounded-2xl shadow-xl transition-all duration-300 ease-in-out ${currentPaddingClass}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <span>스튜디오</span>
                        <span className="mx-2">{'>'}</span>
                        <span className="text-gray-700 font-medium">메모</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDetailDocId(null)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="닫기">
                            <PanelRightClose className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {/* Ensure title and summary content are constrained by parent width */}
                <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                    <h1 className="text-xl font-semibold text-gray-800 mb-1 truncate w-full" title={detailedViewDocInfo.file}>
                        {detailedViewDocInfo.file}
                    </h1>
                    <p className="text-xs text-gray-500 mb-6">(저장된 대답은 보기 전용입니다.)</p>
                    <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
                        {/* Ensure p tag wraps text */}
                        <p className="break-words">{detailedViewDocDetails.deep_summary}</p>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside className={`w-full h-full bg-white flex flex-col transition-all duration-300 ease-in-out rounded-2xl shadow-xl ${currentPaddingClass}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center h-10' : 'justify-between h-10 border-b border-gray-200'}`}>
                {!isCollapsed && (
                    <h2 className="text-base font-semibold text-gray-900">스튜디오</h2>
                )}
                <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <PanelLeftClose className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
                </button>
            </div>

            {!isCollapsed ? (
                <div className="flex-1 space-y-6 overflow-y-auto mt-5">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-medium text-gray-900">노트</h3>
                            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
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
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            자세히 알아보기
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                className={`p-3 border rounded-xl transition-colors text-left w-full ${isDocumentSelected ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 cursor-not-allowed'}`}
                                disabled={!isDocumentSelected || !!isLoadingBriefing}
                            >
                                <div className="flex items-center space-x-2">
                                    {!!isLoadingBriefing ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <FileText className={`w-4 h-4 ${isDocumentSelected ? 'text-gray-500' : 'text-gray-400'}`} />}
                                    <span className={`text-sm font-medium ${isDocumentSelected ? 'text-gray-700' : 'text-gray-400'}`}>문서 상세 요약</span>
                                </div>
                            </button>
                        </div>

                        {activeBriefingDocId && (
                            <div className="space-y-3">
                                {/* Moved console.log outside of JSX rendering path */}
                                {!!isLoadingBriefing ? (
                                    <div className="rounded-lg shadow-sm border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center space-x-3">
                                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                            <span className="text-sm text-gray-500">상세 요약 로딩 중...</span>
                                        </div>
                                    </div>
                                ) : activeDocDetail && activeDocInfo ? ( // Ensure both detail and info are present
                                    <div
                                        className="mt-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setDetailDocId(activeBriefingDocId)}
                                        title={`View details for ${activeDocInfo.file}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <FileText className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-800 truncate" title={activeDocInfo.file}>
                                                    {activeDocInfo.file}
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2" title={activeDocDetail.deep_summary}>
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
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center pt-3 space-y-3">
                    <button
                        onClick={() => { if (onAddNote) onAddNote(); if (isCollapsed) onToggleCollapse(); }}
                        className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                        aria-label="Add new note"
                        title="Add new note"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
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
