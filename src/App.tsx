import React, { useEffect, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
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
  isSummaryPanelOpenAtom,
  isChatPanelOpenAtom,
  processingStatusAtom,
  processDataResponseAtom,
  parsedMeetingInfoAtom,
} from './store/atoms';
import APIController from './controllers/APIController';
import SummaryPanel from './components/organisms/SummaryPanel';
import { MessageCircle } from 'lucide-react';
import { registerServiceWorkerAndSubscribe, unsubscribeFromPushNotifications } from './lib/pushUtils';
import { PushSubscriptionJSON } from './types';

const App: React.FC = () => {
  const rightSidebarDetailDocId = useAtomValue(rightSidebarDetailDocIdAtom);
  const isLeftSidebarOpen = useAtomValue(isLeftSidebarOpenAtom);
  const setIsLeftSidebarOpen = useSetAtom(isLeftSidebarOpenAtom);
  const isRightSidebarOpen = useAtomValue(isRightSidebarOpenAtom);
  const setIsRightSidebarOpen = useSetAtom(isRightSidebarOpenAtom);
  const isSummaryPanelOpen = useAtomValue(isSummaryPanelOpenAtom);
  const setIsSummaryPanelOpen = useSetAtom(isSummaryPanelOpenAtom);
  const isChatPanelOpen = useAtomValue(isChatPanelOpenAtom);
  const setIsChatPanelOpen = useSetAtom(isChatPanelOpenAtom);

  const setProcessingStatus = useSetAtom(processingStatusAtom);
  const setProcessDataResponse = useSetAtom(processDataResponseAtom);
  const setParsedMeetingInfo = useSetAtom(parsedMeetingInfoAtom); // Added

  const [isNewStudioModalOpen, setIsNewStudioModalOpen] = useState(false);
  const [isAllDocumentsModalOpen, setIsAllDocumentsModalOpen] = useState(false);
  const [leftSidebarExpandedDocId, setLeftSidebarExpandedDocId] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscriptionJSON | null>(null);
  const [pushNotificationStatus, setPushNotificationStatus] = useState<string>("확인 중...");

  useEffect(() => {
    const initializePush = async () => {
      setPushNotificationStatus("푸시 알림 상태 확인 중...");
      try {
        const sub = await registerServiceWorkerAndSubscribe();
        if (sub) {
          setCurrentSubscription(sub);
          setPushNotificationStatus(`알림 구독 중: ${sub.endpoint.substring(0, 30)}...`);
          console.log("App: 푸시 알림 구독 성공:", sub.endpoint);
        } else {
          setPushNotificationStatus("푸시 알림이 구독되지 않았거나 권한이 거부되었습니다.");
          console.log("App: 푸시 알림 구독에 실패했거나 권한이 거부되었습니다.");
          // 권한 상태 확인
          if (Notification.permission === "denied") {
            setPushNotificationStatus("알림 권한이 차단되었습니다. 브라우저 설정을 확인해주세요.");
          } else if (Notification.permission === "default") {
            setPushNotificationStatus("알림 권한이 요청되지 않았습니다. 버튼을 클릭하여 구독하세요.");
          }
        }
      } catch (err) {
        console.error("App: 푸시 알림 초기화 중 예외 발생:", err);
        setPushNotificationStatus("푸시 알림 설정 중 오류 발생.");
      }
    };

    initializePush();
  }, []);

  const handleSubscribe = async () => {
    setPushNotificationStatus("푸시 알림 구독 시도 중...");
    try {
      const sub = await registerServiceWorkerAndSubscribe();
      if (sub) {
        setCurrentSubscription(sub);
        setPushNotificationStatus(`알림 구독 완료: ${sub.endpoint.substring(0, 30)}...`);
        console.log("App: 수동 푸시 알림 구독 성공:", sub.endpoint);
      } else {
        setPushNotificationStatus("푸시 알림 구독에 실패했습니다. 권한을 확인해주세요.");
        if (Notification.permission === "denied") {
          setPushNotificationStatus("알림 권한이 차단되었습니다. 브라우저 설정을 확인해주세요.");
        }
      }
    } catch (err) {
      console.error("App: 수동 푸시 알림 구독 중 예외 발생:", err);
      setPushNotificationStatus("푸시 알림 구독 중 오류 발생.");
    }
  };

  const handleUnsubscribe = async () => {
    if (!currentSubscription) {
      setPushNotificationStatus("현재 구독된 정보가 없습니다.");
      return;
    }
    setPushNotificationStatus("푸시 알림 구독 해지 시도 중...");
    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setCurrentSubscription(null);
        setPushNotificationStatus("푸시 알림 구독이 해지되었습니다.");
        console.log("App: 푸시 알림 구독 해지 성공.");
      } else {
        setPushNotificationStatus("푸시 알림 구독 해지에 실패했습니다.");
        console.log("App: 푸시 알림 구독 해지 실패.");
      }
    } catch (err) {
      console.error("App: 푸시 알림 구독 해지 중 예외 발생:", err);
      setPushNotificationStatus("푸시 알림 구독 해지 중 오류 발생.");
    }
  };


  const handleToggleLeftSidebarExpand = (id: string) => {
    setLeftSidebarExpandedDocId(prevId => {
      const newExpandedId = prevId === id ? null : id;
      if (newExpandedId && !isLeftSidebarOpen) {
        setIsLeftSidebarOpen(true);
      }
      return newExpandedId;
    });
  };

  const toggleLeftSidebarCollapse = () => {
    setIsLeftSidebarOpen(prev => !prev);
    if (isLeftSidebarOpen) {
      setLeftSidebarExpandedDocId(null);
    }
  };

  const toggleRightSidebarCollapse = () => {
    setIsRightSidebarOpen(prev => !prev);
  };

  const toggleSummaryPanelCollapse = () => {
    setIsSummaryPanelOpen(prev => {
      const newState = !prev;
      if (newState) {
        setIsChatPanelOpen(false);
      } else {
        setIsChatPanelOpen(true);
      }
      return newState;
    });
  };

  const toggleChatPanelCollapse = () => {
    setIsChatPanelOpen(prev => {
      const newState = !prev;
      if (newState) {
        setIsSummaryPanelOpen(false);
      } else {
        setIsSummaryPanelOpen(true);
      }
      return newState;
    });
  };

  const handleFileUploadAndProcess = async (file: File, meeting_info: string, participants?: string, language?: string) => {
    setProcessDataResponse(null);
    setParsedMeetingInfo(null); // Reset parsed meeting info
    setIsLeftSidebarOpen(false);
    setIsRightSidebarOpen(false);

    setProcessingStatus("파일 처리 중...");
    const timeoutId1 = setTimeout(() => {
      setProcessingStatus("데이터 분석 중...");
    }, 5000);

    const timeoutId2 = setTimeout(() => {
      setProcessingStatus("문서 요약 중...");
    }, 5000 + 5000);

    try {
      const responseData = await APIController.processDocument(file, meeting_info, participants, language);

      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);

      setProcessDataResponse(responseData);
      console.log("Combined data received:", responseData);

      setIsLeftSidebarOpen(true);
      setIsRightSidebarOpen(true);
      setProcessingStatus("모든 과정 완료!");

    } catch (error) {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      console.error("Processing error:", error);
      setProcessingStatus(`오류 발생: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const closeAllDocumentsModal = () => setIsAllDocumentsModalOpen(false);

  let rightSidebarWidthClass = 'w-[25.2rem]';
  if (!isRightSidebarOpen) {
    rightSidebarWidthClass = 'w-[72px]';
  } else if (rightSidebarDetailDocId) {
    rightSidebarWidthClass = 'w-5/9';
  }

  const leftSidebarWidthClass = !isLeftSidebarOpen
    ? 'w-[72px]'
    : leftSidebarExpandedDocId
      ? 'w-[40vw]'
      : 'w-80';

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fa]">
      <TopBar
        currentSubscription={currentSubscription}
        pushNotificationStatus={pushNotificationStatus}
        onSubscribe={handleSubscribe}
        onUnsubscribe={handleUnsubscribe}
      />

      <div className="flex flex-1 gap-6 px-8 py-2 overflow-hidden">
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${leftSidebarWidthClass}`}
        >
          <LeftSidebar
            isCollapsed={!isLeftSidebarOpen}
            onToggleCollapse={toggleLeftSidebarCollapse}
            expandedDocId={leftSidebarExpandedDocId}
            onToggleExpand={handleToggleLeftSidebarExpand}
          />
        </div>

        {/* 메인 컨테이너: 하나의 컨테이너에서 SummaryPanel과 ChatPanel 관리 */}
        <motion.main
          key="main-content-panel"
          className="flex-1 min-w-0 relative"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0, transition: { duration: 0.2, delay: 0.05 } }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
        >
          {/* SummaryPanel */}
          <motion.div
            key="summary-panel"
            className="bg-white rounded-2xl shadow-xl absolute inset-0"
            initial={false}
            animate={{
              y: isSummaryPanelOpen ? 0 : '-100%',
              opacity: isSummaryPanelOpen ? 1 : 0,
            }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
          >
            <SummaryPanel
              onFileUpload={handleFileUploadAndProcess}
              isCollapsed={!isSummaryPanelOpen}
              onToggleCollapse={toggleSummaryPanelCollapse}
            />
          </motion.div>

          {/* ChatPanel */}
          <motion.div
            key="chat-panel"
            className="bg-white rounded-2xl shadow-xl absolute inset-0"
            initial={false}
            animate={{
              y: isChatPanelOpen ? 0 : '100%',
              opacity: isChatPanelOpen ? 1 : 0,
            }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
          >
            <ChatPanel
              // isCollapsed={!isChatPanelOpen} // Removed as ChatPanel no longer uses this
              onToggleCollapse={toggleChatPanelCollapse}
            />
          </motion.div>

          {/* 채팅 버튼 - SummaryPanel이 열려있을 때만 표시 */}
          <AnimatePresence>
            {isSummaryPanelOpen && (
              <motion.button
                key="chat-button"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={toggleChatPanelCollapse}
                className="absolute bottom-4 right-4 w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-600 transition-colors cursor-pointer z-10"
                aria-label="Open Chat"
              >
                <MessageCircle className="w-8 h-8 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.main>

        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${rightSidebarWidthClass}`}
        >
          <div className="bg-white rounded-2xl shadow-xl h-full">
            <RightSidebar
              isCollapsed={!isRightSidebarOpen}
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
