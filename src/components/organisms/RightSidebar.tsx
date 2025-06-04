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
    FileArchive, // Generic file icon
} from 'lucide-react';
import { selectedDocIdAtom, docDetailsAtom, processDataResponseAtom, fetchedDocInfoIdsAtom, activatedBriefingIdsAtom, docSummariesAtom, rightSidebarDetailDocIdAtom } from '../../store/atoms'; // Use processDataResponseAtom
import { useAtom } from 'jotai';
import APIController from '../../controllers/APIController';
import { DocsInfo, OriginFile, ProcessDataResponse, DocumentDetail } from '../../types'; // Import ProcessDataResponse and DocumentDetail

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
    const docSummaries = useAtomValue(docSummariesAtom); // For checking summary from LeftSidebar
    const processData = useAtomValue(processDataResponseAtom); // Use the new combined atom
    const currentDocsInfo: DocsInfo[] = processData?.docs_info || [];
    const originFile = processData?.origin_file; // Get origin_file from the combined response
    const fetchedDocInfoIds = useAtomValue(fetchedDocInfoIdsAtom);

    const setDocDetails = useSetAtom(docDetailsAtom);
    const setDocSummariesAtom = useSetAtom(docSummariesAtom); // Renamed to avoid conflict
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
        console.log("RightSidebar: activeBriefingDocId set in handleShowBriefingClick to:", selectedDocId);

        const docAlreadyFetchedGeneral = fetchedDocInfoIds.has(selectedDocId);
        const existingDetailForDocId: DocumentDetail | null = allDocDetails[selectedDocId];
        const hasDeepSummary = !!existingDetailForDocId?.deep_summary;

        // Fetch if not generally fetched OR if fetched but deep_summary is missing
        const needsToFetchForDeepSummary = !docAlreadyFetchedGeneral || (docAlreadyFetchedGeneral && !hasDeepSummary);

        if (needsToFetchForDeepSummary) {
            try {
                console.log(`RightSidebar: Fetching details for ${selectedDocId} because needsToFetchForDeepSummary is true.`);
                const responseData = await APIController.getDocumentInfo(selectedDocId); // Expect { summary: string, deep_summary: string }
                const fetchedDocDetail = responseData;

                if (fetchedDocDetail) {
                    setDocDetails(prev => ({ ...prev, [selectedDocId]: fetchedDocDetail }));
                    // Also update docSummariesAtom if summary is present and not a placeholder
                    if (fetchedDocDetail.summary && (!docSummaries[selectedDocId] || ["요약 정보를 찾을 수 없습니다.", "요약 정보 로딩 중...", "요약 정보가 없습니다."].includes(docSummaries[selectedDocId]))) {
                        setDocSummariesAtom(prev => ({ ...prev, [selectedDocId]: fetchedDocDetail.summary }));
                    }
                } else {
                    console.warn(`RightSidebar: Document detail not found for ${selectedDocId}.`);
                    setDocDetails(prev => ({ ...prev, [selectedDocId]: null })); // Mark as null if fetch returned no data
                    if (!docSummaries[selectedDocId]) { // Only set error if no summary exists from LeftSidebar
                        setDocSummariesAtom(prev => ({ ...prev, [selectedDocId]: "상세 정보를 찾을 수 없습니다." }));
                    }
                }
                // Mark as fetched (general fetch, not specific to deep_summary)
                setFetchedDocInfoIds(prev => new Set(prev).add(selectedDocId));
            } catch (error) {
                console.error(`RightSidebar: Failed to fetch document detail for ${selectedDocId}:`, error);
                setDocDetails(prev => ({ ...prev, [selectedDocId]: null })); // Mark as null on error
                if (!docSummaries[selectedDocId]) { // Only set error if no summary exists from LeftSidebar
                    setDocSummariesAtom(prev => ({ ...prev, [selectedDocId]: "상세 정보 로딩 실패." }));
                }
                setFetchedDocInfoIds(prev => new Set(prev).add(selectedDocId)); // Mark as fetched even on error to prevent loops
            }
        } else {
            console.log(`RightSidebar: Details (deep_summary) for ${selectedDocId} already fetched or summary from LeftSidebar exists. No new fetch needed.`);
        }
    }, [selectedDocId, fetchedDocInfoIds, allDocDetails, docSummaries, setActivatedBriefingIds, setDocDetails, setDocSummariesAtom, setFetchedDocInfoIds]);

    const activeDocDetail = activeBriefingDocId ? allDocDetails[activeBriefingDocId] : null;
    const activeDocInfo = activeBriefingDocId ? currentDocsInfo.find((doc: DocsInfo) => doc.doc_id === activeBriefingDocId) : null;

    // isLoadingBriefing should be true if we've clicked "문서 상세 요약" (so activeBriefingDocId is set)
    // AND ( EITHER (fetchedDocInfoIds does NOT have the ID meaning getDocumentInfo was never called for it)
    //      OR (fetchedDocInfoIds HAS the ID, BUT allDocDetails for it is null (fetch failed/no data) or missing deep_summary) )
    const isLoadingBriefing = activeBriefingDocId &&
        activatedBriefingIds.has(activeBriefingDocId) &&
        (
            !fetchedDocInfoIds.has(activeBriefingDocId) ||
            (fetchedDocInfoIds.has(activeBriefingDocId) && (!allDocDetails[activeBriefingDocId]?.deep_summary && allDocDetails[activeBriefingDocId] !== null))
        );


    console.log("RightSidebar render states:", {
        selectedDocId,
        activeBriefingDocId,
        isDocumentSelected,
        isLoadingBriefing,
        activatedBriefingIds: Array.from(activatedBriefingIds),
        fetchedDocInfoIds: Array.from(fetchedDocInfoIds),
        activeDocInfo,
        activeDocDetail,
        allDocDetailsForActive: activeBriefingDocId ? allDocDetails[activeBriefingDocId] : undefined
    });


    // const handleBriefingIconClick = () => { // This function is not directly used, the logic is inlined below.
    //     if (isCollapsed) {
    //         onToggleCollapse();
    //     }
    //     if (activeBriefingDocId && detailDocId !== activeBriefingDocId) {
    //         setDetailDocId(activeBriefingDocId);
    //     }
    // };

    const detailedViewDocInfo = detailDocId ? currentDocsInfo.find((doc: DocsInfo) => doc.doc_id === detailDocId) : null;
    const detailedViewDocDetails = detailDocId ? allDocDetails[detailDocId] : null;

    const ORIGINAL_DOC_ID_PREFIX = "original_document_";
    const isViewingOriginFileDetail = detailDocId && detailDocId.startsWith(ORIGINAL_DOC_ID_PREFIX) && originFile;

    let currentPaddingClass = 'p-4';
    if (isCollapsed) {
        currentPaddingClass = 'p-3';
    } else if (detailDocId) {
        currentPaddingClass = 'p-6';
    }

    useEffect(() => {
        if (detailDocId) {
            const isOriginDetail = detailDocId.startsWith(ORIGINAL_DOC_ID_PREFIX);
            if (isOriginDetail && !originFile) {
                setDetailDocId(null);
            }
            // Logic for closing RAG doc detail if selection changes might need review based on UX.
            // For now, if a RAG doc detail (not origin) is open, and selectedDocId (from LeftSidebar)
            // changes to something *different* than the current detailDocId, or becomes null,
            // consider if the detail view should close.
            // This is tricky because user might want to keep detail open while browsing other summaries in LeftSidebar.
            // Current behavior: detail view stays open unless explicitly closed or origin file disappears.
        }
    }, [selectedDocId, detailDocId, originFile, setDetailDocId]);


    if (detailDocId) {
        let title = "";
        let content: React.ReactNode = null;
        let breadcrumb = "메모";

        if (isViewingOriginFileDetail && originFile) {
            title = originFile.file_name;
            breadcrumb = "원본 문서 정보";
            content = (
                <>
                    <div className="text-xs text-gray-600 space-y-1 mt-2 mb-3">
                        <p><strong>타입:</strong> {originFile.file_type}</p>
                        <p><strong>크기:</strong> {(Number(originFile.file_size) / 1024).toFixed(1)} KB</p>
                        {originFile.link && <p><strong>링크:</strong> <a href={originFile.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{originFile.link}</a></p>}
                    </div>
                    {originFile.text && (
                        <div className="mt-2 flex-1 overflow-y-auto prose prose-sm max-w-none border-t border-gray-200 pt-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-1">원본 내용:</h5>
                            <p className="whitespace-pre-wrap break-words text-xs text-gray-700">{originFile.text}</p>
                        </div>
                    )}
                </>
            );
        } else if (detailedViewDocInfo && detailedViewDocDetails?.deep_summary) { // Ensure deep_summary exists
            title = detailedViewDocInfo.doc_name;
            breadcrumb = "문서 상세 요약";
            content = (
                <>
                    {/* <p className="text-xs text-gray-500 mb-6">(저장된 대답은 보기 전용입니다.)</p> */}
                    <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
                        <p className="break-words">{detailedViewDocDetails.deep_summary}</p>
                    </div>
                </>
            );
        } else if (detailedViewDocInfo && detailedViewDocDetails === null && fetchedDocInfoIds.has(detailDocId)) {
            // Data was fetched, but API returned null or an error occurred for this specific doc's details
            title = detailedViewDocInfo.doc_name;
            breadcrumb = "오류";
            content = <p className="text-sm text-red-700">문서 상세 정보를 불러오는데 실패했습니다.</p>;
        } else if (detailedViewDocInfo && !detailedViewDocDetails && !fetchedDocInfoIds.has(detailDocId)) {
            // Data not yet fetched for this detail view, should show loading or trigger fetch
            // This state should ideally be caught by isLoadingBriefing or similar before opening detail view
            // For now, show a generic loading, but this indicates a potential logic gap if reached.
            title = detailedViewDocInfo.doc_name;
            breadcrumb = "로딩 중";
            content = <div className="flex items-center space-x-3"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /><span className="text-sm text-gray-500">상세 요약 로딩 중...</span></div>;
        }
        else {
            // Fallback if data is inconsistent, or if detailDocId is set but no matching info/details
            // This might happen if detailDocId is stale.
            return (
                <aside className={`w-full h-full bg-white flex flex-col rounded-2xl shadow-xl transition-all duration-300 ease-in-out ${currentPaddingClass}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                            <span>스튜디오</span>
                            <span className="mx-2">{'>'}</span>
                            <span className="text-gray-700 font-medium">정보 없음</span>
                        </div>
                        <button onClick={() => setDetailDocId(null)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="닫기">
                            <PanelRightClose className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">선택된 항목에 대한 상세 정보가 없습니다.</div>
                </aside>
            );
        }

        return (
            <aside className={`w-full h-full bg-white flex flex-col rounded-2xl shadow-xl transition-all duration-300 ease-in-out ${currentPaddingClass}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                        <span>스튜디오</span>
                        <span className="mx-2">{'>'}</span>
                        <span className="text-gray-700 font-medium">{breadcrumb}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDetailDocId(null)} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700" title="닫기">
                            <PanelRightClose className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                    <h1 className="text-xl font-semibold text-gray-800 mb-1 truncate w-full" title={title}>
                        {title}
                    </h1>
                    {content}
                </div>
            </aside>
        );
    }

    // Main sidebar view (not detail view)
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

                        {originFile ? (
                            <div
                                className="mt-3 p-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => setDetailDocId(ORIGINAL_DOC_ID_PREFIX + originFile.file_name)}
                                title={`View details for ${originFile.file_name}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <FileArchive className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-800 truncate" title={originFile.file_name}>
                                            {originFile.file_name}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            원본 문서 ({originFile.file_type}, {(Number(originFile.file_size) / 1024).toFixed(1)} KB)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-3 p-3 border border-gray-200 rounded-xl bg-gray-50 text-center">
                                <FileArchive className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                <p className="text-xs text-gray-500">업로드된 파일이 여기에 표시됩니다.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
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
                                    {isLoadingBriefing ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <FileText className={`w-4 h-4 ${isDocumentSelected ? 'text-gray-500' : 'text-gray-400'}`} />}
                                    <span className={`text-sm font-medium ${isDocumentSelected ? 'text-gray-700' : 'text-gray-400'}`}>문서 상세 요약</span>
                                </div>
                            </button>
                        </div>

                        {activeBriefingDocId && ( // This section shows the preview of the deep_summary
                            <div className="space-y-3">
                                {isLoadingBriefing ? (
                                    <div className="rounded-lg shadow-sm border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-center space-x-3">
                                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                            <span className="text-sm text-gray-500">상세 요약 로딩 중...</span>
                                        </div>
                                    </div>
                                ) : activeDocDetail?.deep_summary && activeDocInfo ? (
                                    <div
                                        className="mt-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => setDetailDocId(activeBriefingDocId)} // Open detail view
                                        title={`View details for ${activeDocInfo.doc_name}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <FileText className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-800 truncate" title={activeDocInfo.doc_name}>
                                                    {activeDocInfo.doc_name}
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2" title={activeDocDetail.deep_summary}>
                                                    {activeDocDetail.deep_summary}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : activeDocDetail === null && fetchedDocInfoIds.has(activeBriefingDocId) ? (
                                    // This means fetch was attempted but resulted in null (error or no data)
                                    <div className="rounded-lg shadow-sm border border-red-200 bg-red-50 p-4">
                                        <div className="flex items-center space-x-3">
                                            <FileWarning className="w-5 h-5 text-red-500" />
                                            <span className="text-sm text-red-700">상세 요약 정보를 불러올 수 없습니다.</span>
                                        </div>
                                        {activeDocInfo && <p className="text-xs text-red-600 mt-1">문서: {activeDocInfo.doc_name}</p>}
                                    </div>
                                ) : null /* Don't show anything if not loading, no data, and not an error state from fetch */}
                            </div>
                        )}
                    </div>
                </div>
            ) : ( // Collapsed state
                <div className="flex-1 flex flex-col items-center pt-3 space-y-3">
                    <button
                        onClick={() => { if (onAddNote) onAddNote(); if (isCollapsed) onToggleCollapse(); }}
                        className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                        aria-label="Add new note"
                        title="Add new note"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    {/* Icon for "문서 상세 요약" when collapsed */}
                    {isDocumentSelected && ( // Only show if a document is selected in LeftSidebar
                        <button
                            onClick={() => {
                                onToggleCollapse(); // Expand the sidebar
                                if (selectedDocId) {
                                    // Ensure briefing is activated and attempt to fetch if needed
                                    handleShowBriefingClick();
                                    // Then set it as the detail view
                                    setDetailDocId(selectedDocId);
                                }
                            }}
                            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800 w-full flex justify-center"
                            aria-label="Open detailed summary"
                            title="문서 상세 요약 보기"
                            disabled={!isDocumentSelected}
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
