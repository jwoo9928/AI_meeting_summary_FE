import React, { useState, useCallback } from 'react';
import { useAtomValue, useSetAtom, useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './components/organisms/TopBar';
import LeftSidebar from './components/organisms/LeftSidebar';
import ChatPanel from './components/organisms/ChatPanel';
import RightSidebar from './components/organisms/RightSidebar';
import AllDocumentsModal from './components/molecules/AllDocumentsModal';
import NewStudioModal from './components/molecules/NewStudioModal';
import {
  rightSidebarDetailDocIdAtom,
  isLeftSidebarOpenAtom,
  isRightSidebarOpenAtom,
  processingStatusAtom,
  processDataResponseAtom, // Use the new combined atom
} from './store/atoms';
import APIController from './controllers/APIController';
import { ProcessDataResponse } from './types'; // Use the new combined type


const App: React.FC = () => {
  const rightSidebarDetailDocId = useAtomValue(rightSidebarDetailDocIdAtom);
  const isLeftSidebarOpen = useAtomValue(isLeftSidebarOpenAtom);
  const setIsLeftSidebarOpen = useSetAtom(isLeftSidebarOpenAtom);
  const isRightSidebarOpen = useAtomValue(isRightSidebarOpenAtom);
  const setIsRightSidebarOpen = useSetAtom(isRightSidebarOpenAtom);

  const setProcessingStatus = useSetAtom(processingStatusAtom);
  const setProcessDataResponse = useSetAtom(processDataResponseAtom); // Setter for the new combined atom


  const [isNewStudioModalOpen, setIsNewStudioModalOpen] = useState(false);
  const [isAllDocumentsModalOpen, setIsAllDocumentsModalOpen] = useState(false);

  // Left Sidebar item expansion state (remains local to App or could be moved to LeftSidebar itself)
  const [leftSidebarExpandedDocId, setLeftSidebarExpandedDocId] = useState<string | null>(null);

  const handleToggleLeftSidebarExpand = (id: string) => {
    setLeftSidebarExpandedDocId(prevId => {
      const newExpandedId = prevId === id ? null : id;
      if (newExpandedId && !isLeftSidebarOpen) { // Use Jotai atom state
        setIsLeftSidebarOpen(true); // Expand sidebar if an item is expanded
      }
      return newExpandedId;
    });
  };

  const toggleLeftSidebarCollapse = () => {
    setIsLeftSidebarOpen(prev => !prev);
    if (isLeftSidebarOpen) { // If collapsing
      setLeftSidebarExpandedDocId(null); // Collapse any expanded item
    }
  };

  const toggleRightSidebarCollapse = () => {
    setIsRightSidebarOpen(prev => !prev);
  };


  const handleFileUploadAndProcess = async (file: File, meeting_info: string, language?: string) => {
    setProcessDataResponse(null); // Reset previous combined data
    setIsLeftSidebarOpen(false);
    setIsRightSidebarOpen(false);

    // Start status cycling
    // Stage 1: "파일 처리 중..." (e.g., STT)
    setProcessingStatus("파일 처리 중...");
    const timeoutId1 = setTimeout(() => {
      setProcessingStatus("데이터 분석 중...");
    }, 1500); // Stage 1 duration: 5 seconds

    const timeoutId2 = setTimeout(() => {
      setProcessingStatus("문서 요약 중...");
    }, 1500 + 1500); // Stage 2 starts after 5s, lasts 5s. Stage 3 starts after 10s.

    try {
      // API call happens in parallel to the status cycling.
      // Backend simulates a 5s delay.
      // The frontend status cycling above is illustrative and might not perfectly match the backend's internal steps.
      const responseData = await APIController.processDocument(file, meeting_info, language, true); // true for is_dumy

      // Clear timeouts if API finishes early (though backend has fixed 5s delay)
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);

      setProcessDataResponse(responseData);
      console.log("Combined data received:", responseData);

      // All data received, now open sidebars
      setIsLeftSidebarOpen(true);
      setIsRightSidebarOpen(true);
      setProcessingStatus("모든 과정 완료!");

    } catch (error) {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      console.error("Processing error:", error);
      setProcessingStatus(`오류 발생: ${error instanceof Error ? error.message : String(error)}`);
      // Optionally, restore sidebar states on error, or keep them closed.
      // setIsLeftSidebarOpen(true); 
      // setIsRightSidebarOpen(true);
    }
  };


  const closeAllDocumentsModal = () => setIsAllDocumentsModalOpen(false);

  // Restore showChatPanel logic using the new atom
  // This logic might need further review based on desired UX when sidebars are open/closed
  const showChatPanel = !(leftSidebarExpandedDocId && rightSidebarDetailDocId);

  let rightSidebarWidthClass = 'w-[25.2rem]'; // Default expanded width
  if (!isRightSidebarOpen) { // Use Jotai atom state
    rightSidebarWidthClass = 'w-[72px]'; // Collapsed width
  } else if (rightSidebarDetailDocId) {
    rightSidebarWidthClass = 'w-5/9'; // Restore to fixed 3/5 width
  }

  // Dynamic width for Left Sidebar
  const leftSidebarWidthClass = !isLeftSidebarOpen
    ? 'w-[72px]'
    : leftSidebarExpandedDocId
      ? 'w-[40vw]'
      : 'w-80';

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fa]">
      <TopBar />
      <div className="flex flex-1 gap-6 px-8 py-2 overflow-hidden">
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${leftSidebarWidthClass}`}
        >
          <LeftSidebar
            isCollapsed={!isLeftSidebarOpen} // Use Jotai atom state
            onToggleCollapse={toggleLeftSidebarCollapse}
            expandedDocId={leftSidebarExpandedDocId}
            onToggleExpand={handleToggleLeftSidebarExpand}
          />
        </div>

        <AnimatePresence>
          {showChatPanel && (
            <motion.main
              key="chat-panel"
              className="flex-1 min-w-0"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0, transition: { duration: 0.2, delay: 0.05 } }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl shadow-xl h-full p-4 flex flex-col w-full">
                {/* Pass handleFileUploadAndProcess to ChatPanel */}
                {/* This assumes ChatPanel has a prop like onFileUpload */}
                <ChatPanel onFileUpload={handleFileUploadAndProcess} />
              </div>
            </motion.main>
          )}
        </AnimatePresence>

        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${rightSidebarWidthClass}`}
        >
          <div className="bg-white rounded-2xl shadow-xl h-full">
            <RightSidebar
              isCollapsed={!isRightSidebarOpen} // Use Jotai atom state
              onToggleCollapse={toggleRightSidebarCollapse}
            />
          </div>
        </div>
      </div>
      <AllDocumentsModal
        isOpen={isAllDocumentsModalOpen}
        onClose={closeAllDocumentsModal}
      />
      <NewStudioModal
        isOpen={isNewStudioModalOpen}
        onClose={() => setIsNewStudioModalOpen(false)}
      />
    </div>
  );
};

export default App;
