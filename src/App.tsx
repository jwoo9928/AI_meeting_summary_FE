import React, { useState, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion
import TopBar from './components/organisms/TopBar';
import LeftSidebar from './components/organisms/LeftSidebar';
import ChatPanel from './components/organisms/ChatPanel';
import RightSidebar from './components/organisms/RightSidebar';
import AllDocumentsModal from './components/molecules/AllDocumentsModal';
import NewStudioModal from './components/molecules/NewStudioModal';
import { rightSidebarDetailDocIdAtom } from './store/atoms';

const App: React.FC = () => {
  const rightSidebarDetailDocId = useAtomValue(rightSidebarDetailDocIdAtom); // Use the atom value

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

  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const toggleRightSidebarCollapse = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
  };

  // Left Sidebar item expansion state
  const [leftSidebarExpandedDocId, setLeftSidebarExpandedDocId] = useState<string | null>(null);

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

  const closeAllDocumentsModal = () => setIsAllDocumentsModalOpen(false);

  // Restore showChatPanel logic using the new atom
  const showChatPanel = !(leftSidebarExpandedDocId && rightSidebarDetailDocId);

  let rightSidebarWidthClass = 'w-[25.2rem]'; // Default expanded width
  if (isRightSidebarCollapsed) {
    rightSidebarWidthClass = 'w-[72px]'; // Collapsed width
  } else if (rightSidebarDetailDocId) { // rightSidebarDetailDocId is from the atom
    rightSidebarWidthClass = 'w-5/9'; // Restore to fixed 3/5 width
  }

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fa]">
      <TopBar />
      {/* Ensure overflow-hidden (or overflow-x-clip if only horizontal overflow is an issue) is present */}
      <div className="flex flex-1 gap-6 px-8 py-2 overflow-hidden">
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isLeftSidebarCollapsed ? 'w-[72px]' : leftSidebarExpandedDocId ? 'w-[40vw]' : 'w-80'}`}
        >
          <LeftSidebar
            isCollapsed={isLeftSidebarCollapsed}
            onToggleCollapse={toggleLeftSidebarCollapse}
            expandedDocId={leftSidebarExpandedDocId}
            onToggleExpand={handleToggleLeftSidebarExpand}
          />
        </div>

        <AnimatePresence>
          {showChatPanel && (
            <motion.main
              key="chat-panel"
              className="flex-1 min-w-0" // Ensure it takes space when visible
              initial={{ opacity: 0, width: 0 }} // Start with 0 width and opacity
              animate={{ opacity: 1, width: 'auto' }} // Animate to auto width and full opacity
              exit={{ opacity: 0, width: 0, transition: { duration: 0.2, delay: 0.05 } }} // Delay slightly less than sidebar animation
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} // Default transition for animate
            >
              {/* The content that needs to be animated */}
              <div className="bg-white rounded-2xl shadow-xl h-full p-4 flex flex-col w-full">
                <ChatPanel />
              </div>
            </motion.main>
          )}
        </AnimatePresence>

        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${rightSidebarWidthClass}`}
        >
          <div className="bg-white rounded-2xl shadow-xl h-full">
            <RightSidebar
              isCollapsed={isRightSidebarCollapsed}
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
