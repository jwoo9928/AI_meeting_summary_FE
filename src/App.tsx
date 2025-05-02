import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import MeetingListSidebar from './components/organisms/MeetingListSidebar'; // Import the new organism
import AppHeader from './components/organisms/AppHeader'; // Import AppHeader
import ProcessStepsBar from './components/organisms/ProcessStepsBar'; // Import ProcessStepsBar
import RightSidebar from './components/organisms/RightSidebar'; // Import RightSidebar
import RealtimeVisualization from './components/organisms/RealtimeVisualization'; // Import RealtimeVisualization
import WebsocketController, { ConnectionStatus } from './controllers/WebsocketController'; // Import ConnectionStatus
import WarningPopup from './components/molecules/WarningPopup'; // Import WarningPopup
import ConfirmationPopup from './components/molecules/ConfirmationPopup'; // Import ConfirmationPopup
import RecordButton from './components/molecules/RecordButton'; // Import RecordButton
import AIInsightsPanel from './components/organisms/AIInsightsPanel'; // Import AIInsightsPanel
import CurrentStepDisplay from './components/organisms/CurrentStepDisplay'; // Import CurrentStepDisplay
import ReportPreview from './components/organisms/ReportPreview'; // Import ReportPreview


type Meeting = {
  id: string;
  title: string;
  date: Date;
  duration: number;
  isSelected: boolean;
  insightScore?: number; // 인사이트 점수 추가
};

// Export Document type for use in other components
export type Document = {
  id: string; // 서버에서 id를 제공하지 않으면 생성 필요
  title: string;
  date?: Date; // 날짜는 없을 수 있으므로 optional
  type: string;
  score?: number; // relevanceScore 대신 score 사용 (서버 데이터 기준)
};

export type ProcessStep = { // Added export
  id: number;
  title: string;
  status: 'pending' | 'processing' | 'completed';
};

export type KeyInsight = { // Added export
  id: string; // 서버에서 id를 제공하지 않으면 생성 필요
  insight: string; // 서버 데이터 기준 필드명 변경 (text -> insight)
  score: number; // 서버 데이터 기준 필드명 변경 (confidence -> score)
  // timestamp는 서버 응답에 없으므로 제거하거나 필요시 추가 구현
};

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  // const [websocket, setWebsocket] = useState<WebSocket | null>(null); // REMOVED - Handled by controller
  // const [isConnected, setIsConnected] = useState(false); // REMOVED - Handled by controller callbacks
  const [processingStarted, setProcessingStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDocumentPanel, setShowDocumentPanel] = useState(false); // Tracks if documents *data* is available
  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1',
      title: '마케팅 전략 회의',
      date: new Date(2025, 3, 25),
      duration: 45,
      isSelected: false,
      insightScore: 87,
    },
    {
      id: '2',
      title: '제품 개발 미팅',
      date: new Date(2025, 3, 26),
      duration: 32,
      isSelected: true,
      insightScore: 92,
    },
    {
      id: '3',
      title: '분기별 예산 회의',
      date: new Date(2025, 3, 22),
      duration: 58,
      isSelected: false,
      insightScore: 76,
    },
  ]);

  // 실시간 AI 관련 상태
  const [liveKeywords, setLiveKeywords] = useState<string[]>([]);
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>([]); // 타입은 나중에 수정
  const [sentimentData, setSentimentData] = useState<number[]>([]);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null); // 4단계 HTML 저장 상태 추가
  const [aiHighlightMode, setAiHighlightMode] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected'); // Add connection status state
  const [warningMessage, setWarningMessage] = useState<string>(''); // Add warning message state
  const [showWarning, setShowWarning] = useState<boolean>(false); // Add warning visibility state
  const [showStopConfirmation, setShowStopConfirmation] = useState<boolean>(false); // State for stop confirmation popup
  const [showLeftSidebar, setShowLeftSidebar] = useState(true); // State for Left Sidebar visibility
  // const [PDFGenerating, setPDFGenerating] = useState(false); // REMOVED - State seems unused in App.tsx

  // 단계 정의 수정 (5단계로 복구)
  const serverSteps: ProcessStep[] = [
    { id: 1, title: '텍스트 생성', status: 'pending' },
    { id: 2, title: '문서 검색', status: 'pending' },
    { id: 3, title: '인사이트 추출', status: 'pending' },
    { id: 4, title: '보고서 정리', status: 'pending' }, // 4단계 명칭 변경 (서버 메시지 기준)
    { id: 5, title: '문서 생성', status: 'pending' }, // 5단계 추가
  ];

  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(serverSteps); // 5단계 기준으로 초기화
  const intervalRef = useRef<number | null>(null);
  // const wsRef = useRef<WebSocket | null>(null); // REMOVED - Handled by controller
  const previewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const animationFrameRef = useRef<number | null>(null); // REMOVED - Moved to RealtimeVisualization

  // REMOVED Waveform visualization useEffect - Moved to RealtimeVisualization

  // 실시간 키워드 & 감정 분석 효과
  useEffect(() => {
    let keywordTimer: number | null = null;
    let sentimentTimer: number | null = null;

    if (isRecording) {
      const keywordBank = [
        "목표 달성", "매출 증가", "사용자 경험", "개발 일정", "기능 개선",
        "프로토타입", "고객 피드백", "성능 최적화", "리소스 배분", "마케팅 전략"
      ];

      keywordTimer = window.setInterval(() => {
        if (Math.random() > 0.6) { // Increased frequency slightly
          const newKeyword = keywordBank[Math.floor(Math.random() * keywordBank.length)];
          setLiveKeywords(prev => [...prev.slice(-5), newKeyword]); // Show up to 6 keywords
        }
      }, 1500); // Generate keywords more often

      sentimentTimer = window.setInterval(() => {
        setSentimentData(prev => {
          const newValue = Math.random() * 0.6 + 0.4; // 0.4 ~ 1.0 (Positive leaning)
          return [...prev.slice(-29), newValue]; // Keep last 30 data points
        });
      }, 800); // Update sentiment more frequently

      return () => {
        if (keywordTimer) clearInterval(keywordTimer);
        if (sentimentTimer) clearInterval(sentimentTimer);
      };
    } else {
      setLiveKeywords([]); // Clear keywords when not recording
      // Optionally keep sentiment data for a bit or clear it
      // setSentimentData([]);
    }
  }, [isRecording]);

  // Define updateStepStatus before the WebSocket useEffect hook
  const updateStepStatus = useCallback((stepId: number, status: ProcessStep['status']) => { // Explicitly type status parameter
    setProcessSteps(prev => {
      // Mark previous steps as completed when a new step starts processing or completes
      const updatedSteps = prev.map((step): ProcessStep => { // Explicitly type the return value of map
        if (step.id < stepId && status !== 'pending') {
          return { ...step, status: 'completed' };
        }
        if (step.id === stepId) {
          return { ...step, status };
        }
        return step;
      });
      return updatedSteps;
    });
  }, []); // Correctly close useCallback here

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  // WebSocket Connection Handling using Controller
  useEffect(() => {
    if (processingStarted && !isRecording) {
      // Define callbacks for the controller
      const callbacks = {
        onOpen: () => {
          console.log('WebSocket Connected (via Controller)');
          // setIsConnected(true); // State removed, handled implicitly
        },
        onClose: (reason?: string) => {
          console.log('WebSocket Disconnected (via Controller):', reason);
          // setIsConnected(false); // State removed
          // Reset processing state if connection closes unexpectedly unless it was the final step
          // Check currentStep state directly here
          setProcessSteps(prevSteps => {
            const finalStepCompleted = prevSteps.find(s => s.id === serverSteps.length)?.status === 'completed';
            if (!finalStepCompleted) {
              console.log('Resetting state due to unexpected disconnect.');
              setProcessingStarted(false);
            }
            return prevSteps; // Keep current steps if final step was reached
          });
        },
        onError: (error: Event) => {
          console.error('WebSocket Error (via Controller):', error);
          // setIsConnected(false); // State removed
          // Handle connection errors (e.g., show an error message to the user)
          // Reset the process
          setProcessingStarted(false);
          setProcessSteps(serverSteps.map(step => ({ ...step, status: 'pending' })));
          setCurrentStep(0);
          // Maybe show an alert or notification to the user
          // alert("WebSocket connection error. Please try again."); // Replace alert with popup
          setWarningMessage('WebSocket connection error. Please check the connection and try again.');
          setShowWarning(true);
        },
        // Pass state setters directly
        onStepUpdate: updateStepStatus, // Pass the existing function
        onDocumentsReceived: (docs: Document[]) => {
          setDocuments(docs);
          setShowDocumentPanel(true); // Show panel when docs arrive
        },
        onInsightsReceived: (insights: KeyInsight[]) => {
          setKeyInsights(insights);
          setShowAIInsights(true); // Show insights when they arrive
        },
        onHtmlReceived: setGeneratedHtml,
        onSetCurrentStep: setCurrentStep,
        // onSetPdfGenerating: setPDFGenerating, // REMOVED
        onSetAiHighlightMode: setAiHighlightMode,
        onStatusChange: setConnectionStatus, // Add the status change handler
      };

      // Connect using the controller
      WebsocketController.connect(callbacks);

      // Cleanup function: Disconnect using the controller
      return () => {
        WebsocketController.disconnect();
      };
    } else {
      // Ensure disconnection if processing stops or recording starts
      WebsocketController.disconnect();
    }
  }, [processingStarted, isRecording, updateStepStatus]); // Add updateStepStatus to dependency array


  // PDF Preview Scroll (Adjusted for 5 steps)
  useEffect(() => {
    // Scroll when step 5 is completed and HTML is generated
    if (currentStep === 5 && processSteps.find(s => s.id === 5)?.status === 'completed' && generatedHtml && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, processSteps, generatedHtml]); // Depend on generatedHtml as well

  const handleRecordToggle = () => {
    if (isRecording) {
      // Stop recording: Show confirmation popup instead of immediate stop
      setShowStopConfirmation(true);
    } else {
      // Start recording: Reset everything
      setIsRecording(true);
      // Reset state for new recording session
      setRecordingTime(0);
      setProcessingStarted(false); // Ensure processing doesn't start immediately
      setCurrentStep(0);
      // setPDFGenerating(false); // REMOVED
      setShowDocumentPanel(false);
      setShowLeftSidebar(false);
      setShowAIInsights(false);
      setKeyInsights([]);
      setDocuments([]); // Clear previous documents
      setGeneratedHtml(null); // Clear previous HTML
      setSentimentData([]);
      setLiveKeywords([]);
      setAiHighlightMode(false);
      setProcessSteps(serverSteps.map(step => ({ ...step, status: 'pending' }))); // Reset steps visual state
      // Close WebSocket connection using the controller
      WebsocketController.disconnect();
    }
  };

  // Handler for confirming stop recording and report generation
  const handleConfirmStop = () => {
    setIsRecording(false);
    setProcessingStarted(true);
    setShowStopConfirmation(false); // Close the popup
  };

  // Handler for canceling stop recording
  const handleCancelStop = () => {
    setShowStopConfirmation(false); // Close the popup
  };

  // REMOVED startProcessingSteps function entirely

  // Moved updateStepStatus definition above the useEffect hook that uses it

  const handleMenuToggle = (id: string) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  const handleMeetingSelect = (id: string) => {
    setMeetings(meetings.map(meeting => ({
      ...meeting,
      isSelected: meeting.id === id
    })));
    // Optionally reset state when selecting a different meeting
    // handleRecordToggle(); // If you want to stop/reset when switching meetings
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Function to get color based on sentiment value
  const getSentimentColor = (value: number) => {
    if (value > 0.8) return 'bg-green-500';
    if (value > 0.6) return 'bg-blue-500';
    if (value > 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Function to get size based on relevance score
  const getDocumentNodeSize = (score: number = 0.5) => {
    return 20 + score * 40; // Base size 20, max additional 40
  };

  // Add the delete handler function
  const handleDeleteMeeting = (id: string) => {
    setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== id));
    setMenuOpen(null); // Close the menu after deleting
  };

  // Add the reset handler function
  const handleReset = () => {
    setIsRecording(false); // Stop recording if active
    setProcessingStarted(false); // Stop processing cycle
    setCurrentStep(0);
    // setPDFGenerating(false); // REMOVED
    setShowDocumentPanel(false);
    setShowAIInsights(false);
    setKeyInsights([]);
    setDocuments([]);
    setGeneratedHtml(null);
    setSentimentData([]);
    setLiveKeywords([]);
    setAiHighlightMode(false);
    setProcessSteps(serverSteps.map(step => ({ ...step, status: 'pending' }))); // Reset steps to initial state
    // Close WebSocket connection using the controller
    WebsocketController.disconnect();
    // Optionally re-select the current meeting or default
  };

  // Toggle Right Sidebar Visibility
  const handleToggleRightSidebar = () => {
    setShowDocumentPanel(prev => !prev);
  };

  // Toggle Left Sidebar Visibility
  const handleToggleLeftSidebar = () => {
    setShowLeftSidebar(prev => !prev);
  };

  // Determine if the final step is completed
  const isProcessComplete = processSteps[serverSteps.length - 1]?.status === 'completed';

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Left Sidebar with Animation */}
      <AnimatePresence>
        {showLeftSidebar && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full z-30" // Use fixed positioning for overlap effect if needed, or adjust layout
          // Or keep relative positioning if main content margin handles it:
          // className="h-full" // Ensure it takes full height if not fixed
          >
            {/* Use MeetingListSidebar Organism */}
            <MeetingListSidebar
              meetings={meetings}
              menuOpenId={menuOpen}
              onSelectMeeting={handleMeetingSelect}
              onToggleMenu={handleMenuToggle}
              onDeleteMeeting={handleDeleteMeeting}
            // Assuming MeetingListSidebar has a fixed width, e.g., w-64
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {/* Adjust margin based on both sidebars visibility */}
      {/* MeetingListSidebar width is w-72 (288px) and RightSidebar width is w-72 (288px) */}
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out ${showLeftSidebar ? 'ml-72' : 'ml-0'} ${showDocumentPanel ? 'mr-72' : 'mr-0'}`}>
        {/* Use AppHeader Organism - Pass connectionStatus and sidebar toggles */}
        <AppHeader
          isRecording={isRecording}
          recordingTime={recordingTime}
          connectionStatus={connectionStatus} // Pass connection status
          processingStarted={processingStarted}
          aiHighlightMode={aiHighlightMode}
          onToggleAiHighlight={() => setAiHighlightMode(!aiHighlightMode)}
          formatTime={formatTime}
          showLeftSidebar={showLeftSidebar} // Pass left sidebar state
          onToggleLeftSidebar={handleToggleLeftSidebar} // Pass left sidebar handler
          showRightSidebar={showDocumentPanel} // Pass right sidebar state for button icon
          onToggleRightSidebar={handleToggleRightSidebar} // Pass right sidebar handler
        />

        {/* Conditionally render ProcessStepsBar with animation */}
        <AnimatePresence>
          {!isProcessComplete && (
            <motion.div
              initial={{ opacity: 1, height: 'auto' }} // Start visible and with auto height
              exit={{ opacity: 0, height: 0 }} // Fade out and collapse height
              transition={{ duration: 0.3 }} // Animation duration
            >
              <ProcessStepsBar processSteps={processSteps} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Scrollable Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto bg-gray-50">
          <div className="max-w-6xl mx-auto">

            {/* Use RealtimeVisualization Organism - Pass isRecording prop */}
            {isRecording && (
              <RealtimeVisualization
                canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>} // Assert type as non-null
                liveKeywords={liveKeywords}
                isRecording={isRecording} // Pass isRecording state
              />
            )}
            {/* Conditionally render CurrentStepDisplay with animation */}
            <AnimatePresence>
              {!isProcessComplete && (
                <motion.div
                  initial={{ opacity: 1 }} // Start visible
                  exit={{ opacity: 0 }} // Fade out
                  transition={{ duration: 0.3 }} // Animation duration
                >
                  <CurrentStepDisplay
                    processingStarted={processingStarted}
                    isRecording={isRecording}
                    currentStep={currentStep}
                    processSteps={processSteps}
                    serverStepsLength={serverSteps.length}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Use AIInsightsPanel Component */}
            <AIInsightsPanel
              showAIInsights={showAIInsights}
              keyInsights={keyInsights}
              sentimentData={sentimentData}
              getSentimentColor={getSentimentColor}
            />

            {/* Use ReportPreview Component */}
            <ReportPreview
              previewRef={previewRef}
              aiHighlightMode={aiHighlightMode}
              isRecording={isRecording}
              processingStarted={processingStarted}
              generatedHtml={generatedHtml}
            />
          </div>
        </div>

        {/* Use RecordButton Component */}
        <RecordButton
          isRecording={isRecording}
          processingStarted={processingStarted}
          onToggle={handleRecordToggle}
        />
      </div>

      {/* Conditionally render RightSidebar based on actualShowRightSidebar */}

      <RightSidebar
        showDocumentPanel={showDocumentPanel}
        documents={documents}
        onReset={handleReset}
        getDocumentNodeSize={getDocumentNodeSize}
      />

      {/* Removed duplicated closing tags */}

      {/* Warning Popup */}
      <WarningPopup
        message={warningMessage}
        isVisible={showWarning}
        onClose={() => setShowWarning(false)}
      />

      {/* Stop Recording Confirmation Popup */}
      <ConfirmationPopup
        isVisible={showStopConfirmation}
        title="녹음 종료"
        message="보고서를 생성하시겠습니까?"
        confirmText="생성"
        cancelText="취소"
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />
    </div>
  );
}; // Correctly close the App component function here

export default App;
