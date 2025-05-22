import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { useAtom, useAtomValue, useSetAtom } from 'jotai'; // Added Jotai hooks
import TopBar from './components/organisms/TopBar';
import LeftSidebar from './components/organisms/LeftSidebar';
import ChatPanel from './components/organisms/ChatPanel';
import RightSidebar from './components/organisms/RightSidebar';
import { DocumentSource } from './types'; // Removed StudioItemData
import AllDocumentsModal from './components/molecules/AllDocumentsModal';
import NewStudioModal from './components/molecules/NewStudioModal';
import { selectedDocIdAtom, fetchedDocInfoIdsAtom, docSummariesAtom, docDetailsAtom } from './store/atoms'; // Added docDetailsAtom
import APIController from './controllers/APIController'; // Added APIController

const App: React.FC = () => {
  const selectedDocId = useAtomValue(selectedDocIdAtom);
  const [fetchedDocInfoIds, setFetchedDocInfoIds] = useAtom(fetchedDocInfoIdsAtom);
  const setDocSummaries = useSetAtom(docSummariesAtom);
  const setDocDetails = useSetAtom(docDetailsAtom); // Added setter for docDetailsAtom

  const [documents, setDocuments] = useState<DocumentSource[]>([
    { id: 'doc1', title: '초기 문서 1.pdf', type: 'pdf', isChecked: false },
    { id: 'doc2', title: '회의록 분석.docx', type: 'docx', isChecked: false },
  ]);
  // const [selectedSourceId, setSelectedSourceId] = useState<string | null>(documents[0]?.id || null); // Managed by Jotai
  const [isNewStudioModalOpen, setIsNewStudioModalOpen] = useState(false);


  const [isAllDocumentsModalOpen, setIsAllDocumentsModalOpen] = useState(false);


  // Left Sidebar collapse state
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const toggleLeftSidebarCollapse = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
    if (!isLeftSidebarCollapsed) {
      setLeftSidebarExpandedDocId(null);
    }
  };

  // Right Sidebar collapse state
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const toggleRightSidebarCollapse = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
    // If collapsing, we might want to clear activeBriefingDocId, or let RightSidebar handle it.
    // For now, just toggle.
  };

  // Right Sidebar detailed view state
  const [rightSidebarDetailDocId, setRightSidebarDetailDocId] = useState<string | null>(null);

  // Left Sidebar item expansion state
  const [leftSidebarExpandedDocId, setLeftSidebarExpandedDocId] = useState<string | null>(null);

  // Effect to reset RightSidebar detail view when LeftSidebar selection changes
  useEffect(() => {
    if (selectedDocId !== rightSidebarDetailDocId) {
      setRightSidebarDetailDocId(null);
    }
    // We also need to handle activeBriefingDocId in RightSidebar.tsx
    // For now, this handles the main detailed view.
  }, [selectedDocId, rightSidebarDetailDocId]); // Removed rightSidebarDetailDocId from deps to avoid loop, only react to selectedDocId

  const handleToggleLeftSidebarExpand = (id: string) => {
    setLeftSidebarExpandedDocId(prevId => {
      const newExpandedId = prevId === id ? null : id;
      // If expanding an item and the sidebar is currently collapsed, un-collapse it.
      if (newExpandedId && isLeftSidebarCollapsed) {
        setIsLeftSidebarCollapsed(false);
      }
      return newExpandedId;
    });
  };


  // --- Source Management (formerly Studio Management) ---
  // const handleSelectSource = useCallback((id: string) => { // Managed by Jotai
  //   setSelectedSourceId(id);
  // }, []);

  const handleAddSourceSubmit = useCallback((name: string) => { // Renamed from handleAddStudioSubmit
    const newSource: DocumentSource = { // Assuming new sources are DocumentSource
      id: `source-${Date.now()}`,
      title: name,
      type: 'text',
      isChecked: false,
    };
    setDocuments((prev: DocumentSource[]) => [...prev, newSource]); // Adding to 'documents'
    // setSelectedSourceId(newSource.id); // Managed by Jotai, though we might want to auto-select new source
    setIsNewStudioModalOpen(false); // Closing the modal
  }, []);

  // --- Document (PDF) Management for RightSidebar (now also for LeftSidebar) ---
  const handleDocumentToggle = useCallback((id: string) => {
    setDocuments((prevDocs: DocumentSource[]) => {
      const newDocs = prevDocs.map((doc: DocumentSource) =>
        doc.id === id ? { ...doc, isChecked: !doc.isChecked } : doc
      );
      // setAreAllDocumentsSelected(newDocs.length > 0 && newDocs.every((doc) => doc.isChecked)); // Unused
      return newDocs;
    });
  }, []);

  // const openAllDocumentsModal = () => setIsAllDocumentsModalOpen(true); // Unused
  const closeAllDocumentsModal = () => setIsAllDocumentsModalOpen(false);

  // --- Report Management for RightSidebar ---
  // const handleSelectReport = useCallback((reportId: string) => { // Unused
  // setSelectedReportId(reportId);
  // }, []);

  // --- Metadata Modal and Processing Flow ---
  // const handleAudioFileReadyForMetadata = (file: File) => { // This function is no longer used as ChatPanel handles uploads
  //   if (!selectedDocId) { 
  //     alert("문서를 먼저 선택하거나 생성해주세요."); 
  //     return;
  //   }
  //   console.log("Audio file ready for metadata (App.tsx):", file.name, "for source:", selectedDocId);
  // };

  const handleShowBriefing = useCallback(async () => {
    if (selectedDocId && !fetchedDocInfoIds.has(selectedDocId)) {
      try {
        // console.log(`App: Fetching summary for ${selectedDocId} via onShowBriefing`);
        const responseData = await APIController.getDocumentInfo(selectedDocId);
        const docDetail = responseData[selectedDocId];

        if (docDetail) {
          setDocDetails(prev => ({ ...prev, [selectedDocId]: docDetail }));
          // Also update docSummariesAtom for consistency if LeftSidebar relies on it
          if (docDetail.summary) {
            setDocSummaries(prev => ({ ...prev, [selectedDocId]: docDetail.summary }));
          } else {
            setDocSummaries(prev => ({ ...prev, [selectedDocId]: "요약 정보 없음" }));
          }
        } else {
          console.warn(`App: Document detail not found for ${selectedDocId} in API response.`);
          setDocDetails(prev => ({ ...prev, [selectedDocId]: null })); // Mark as fetched but no data
          setDocSummaries(prev => ({ ...prev, [selectedDocId]: "상세 정보를 찾을 수 없습니다." }));
        }

        setFetchedDocInfoIds(prev => {
          const newSet = new Set(prev);
          newSet.add(selectedDocId);
          return newSet;
        });
        // console.log(`App: Document detail fetched for ${selectedDocId} via onShowBriefing`, docDetail);
      } catch (error) {
        console.error(`App: Failed to fetch document detail for ${selectedDocId} via onShowBriefing:`, error);
        if (selectedDocId) {
          setDocDetails(prev => ({ ...prev, [selectedDocId]: null })); // Mark as fetched, error state
          setDocSummaries(prev => ({ ...prev, [selectedDocId]: "상세 정보 로딩 실패." }));
        }
      }
    } else if (selectedDocId && fetchedDocInfoIds.has(selectedDocId)) {
      // console.log(`App: Document detail for ${selectedDocId} already fetched. Triggering briefing UI.`);
      // UI update will be handled by RightSidebar reacting to activeBriefingDocId and docDetailsAtom
    } else {
      // console.log("App: No document selected for briefing.");
    }
  }, [selectedDocId, fetchedDocInfoIds, setFetchedDocInfoIds, setDocSummaries, setDocDetails]);

  const showChatPanel = !(leftSidebarExpandedDocId && rightSidebarDetailDocId);

  // Determine Right Sidebar width
  let rightSidebarWidthClass = 'w-[25.2rem]'; // Default expanded width
  if (isRightSidebarCollapsed) {
    rightSidebarWidthClass = 'w-[72px]'; // Collapsed width
  } else if (rightSidebarDetailDocId) {
    rightSidebarWidthClass = 'w-3/5'; // Detailed view width (takes 3/5 of screen)
    // If LeftSidebar is also expanded, RightSidebar might need to adjust or be prioritized.
    // For now, let's assume 3/5 is absolute. If Left is 40vw (2/5), this leaves no space for chat.
    // The showChatPanel logic handles hiding chat.
  }

  // Corrected useEffect dependency for resetting rightSidebarDetailDocId
  useEffect(() => {
    if (rightSidebarDetailDocId && selectedDocId !== rightSidebarDetailDocId) {
      setRightSidebarDetailDocId(null);
    }
  }, [selectedDocId, rightSidebarDetailDocId]);

  // Removed the useEffect that forcibly collapses LeftSidebar

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fa]">
      <TopBar />
      <div className="flex flex-1 gap-6 px-8 py-2 overflow-hidden">
        {/* Left Sidebar */}
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isLeftSidebarCollapsed ? 'w-[72px]' : leftSidebarExpandedDocId ? 'w-[40vw]' : 'w-80'
            }`}
        >
          <LeftSidebar
            onAddSource={() => setIsNewStudioModalOpen(true)}
            isCollapsed={isLeftSidebarCollapsed} // Reverted to direct state
            onToggleCollapse={toggleLeftSidebarCollapse}
            expandedDocId={leftSidebarExpandedDocId} // Reverted to direct state
            onToggleExpand={handleToggleLeftSidebarExpand}
          />
        </div>

        {/* Center: Chat Panel */}
        <main
          className={`transition-all duration-300 ease-in-out 
            ${showChatPanel ? 'flex-1 min-w-0 opacity-100' : 'flex-none w-0 min-w-0 opacity-0 pointer-events-none'}`}
        >
          <div className="bg-white rounded-2xl shadow-xl h-full p-4 flex flex-col">
            <ChatPanel />
          </div>
        </main>

        {/* Right Sidebar */}
        <div
          // Allow RightSidebar to shrink if detailDocId is active and space is tight
          className={`transition-all duration-300 ease-in-out ${rightSidebarDetailDocId ? 'flex-shrink' : 'flex-shrink-0'} ${rightSidebarWidthClass}`}
        >
          <div className="bg-white rounded-2xl shadow-xl h-full">
            <RightSidebar
              onShowBriefing={handleShowBriefing}
              isCollapsed={isRightSidebarCollapsed}
              onToggleCollapse={toggleRightSidebarCollapse}
              detailDocId={rightSidebarDetailDocId}
              onShowDetail={setRightSidebarDetailDocId}
            />
          </div>
        </div>
      </div>
      {/* 모달 등 기타 UI는 기존대로 유지 */}
      <AllDocumentsModal
        isOpen={isAllDocumentsModalOpen}
        onClose={closeAllDocumentsModal}
        documents={documents}
        onDocumentToggle={handleDocumentToggle} // Added missing prop
      />
      <NewStudioModal
        isOpen={isNewStudioModalOpen}
        onClose={() => setIsNewStudioModalOpen(false)}
        onSubmit={handleAddSourceSubmit}
      />
    </div>
  );
};

export default App;
