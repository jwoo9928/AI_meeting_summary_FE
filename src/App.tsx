import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import MeetingListSidebar from './components/organisms/MeetingListSidebar'; // Import the new organism
import AppHeader from './components/organisms/AppHeader'; // Import AppHeader
import ProcessStepsBar from './components/organisms/ProcessStepsBar'; // Import ProcessStepsBar
import RightSidebar from './components/organisms/RightSidebar'; // Import RightSidebar
import RealtimeVisualization from './components/organisms/RealtimeVisualization'; // Import RealtimeVisualization
import WebsocketController, { ConnectionStatus, MeetingMetadata } from './controllers/WebsocketController'; // Import ConnectionStatus and MeetingMetadata
import WarningPopup from './components/molecules/WarningPopup'; // Import WarningPopup
import ConfirmationPopup from './components/molecules/ConfirmationPopup'; // Import ConfirmationPopup
import RecordButton from './components/molecules/RecordButton'; // Import RecordButton
import AIInsightsPanel from './components/organisms/AIInsightsPanel'; // Import AIInsightsPanel
import CurrentStepDisplay from './components/organisms/CurrentStepDisplay'; // Import CurrentStepDisplay
import ReportPreview from './components/organisms/ReportPreview'; // Import ReportPreview
import ChatbotSidebar from './components/organisms/ChatbotSidebar'; // Import ChatbotSidebar
import DocumentTypeSelectionPopup from './components/molecules/DocumentTypeSelectionPopup'; // Import the new popup
import RecordInfoPopup from './components/molecules/RecordInfoPopup'; // Import RecordInfoPopup


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
  const [recordingCompleted, setRecordingCompleted] = useState<boolean>(false); // State to indicate recording is finished but processing hasn't started
  const [showDocTypePopup, setShowDocTypePopup] = useState<boolean>(false); // State for document type selection popup
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]); // State for selected document types
  const [activeLeftSidebar, setActiveLeftSidebar] = useState<'meetingList' | 'chatbot' | 'none'>('meetingList'); // Single state for active left sidebar
  // const [PDFGenerating, setPDFGenerating] = useState(false); // REMOVED - State seems unused in App.tsx
  const [recordInfo, setRecordInfo] = useState<{
    author: string;
    participants: string[];
    purpose: string;
    title: string;
    meeting_info: string;
  } | null>(null);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<Blob | null>(null); // Changed type to Blob | null
  const [uploadedFileNameForDisplay, setUploadedFileNameForDisplay] = useState<string | null>(null); // New state for display name
  const [isSharedRecordInfoPopupVisible, setIsSharedRecordInfoPopupVisible] = useState(false);
  const [completionContextMessage, setCompletionContextMessage] = useState<string | null>(null);
  const [liveAudioChunks, setLiveAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
    // Connect only if processing has started, not currently recording, AND meeting info is available.
    if (processingStarted && !isRecording && recordInfo) {
      const callbacks = {
        onOpen: async () => {
          console.log('WebSocket Connected (via Controller), preparing to send data.');
          // Re-verify that audio file and record info are available right before sending
          if (uploadedAudioFile && recordInfo) {
            const metadataToSend: MeetingMetadata = {
              title: recordInfo.title,
              author: recordInfo.author,
              participants: recordInfo.participants,
              meeting_purpose: recordInfo.purpose, // Maps from recordInfo.purpose
              meeting_info: recordInfo.meeting_info
            };
            console.log('[App.tsx onOpen] Attempting to send meeting data via WebSocket with new metadata structure:', metadataToSend);
            const success = await WebsocketController.sendMeetingData(metadataToSend, uploadedAudioFile);
            if (success) {
              console.log('[App.tsx onOpen] Meeting data sent successfully.');
              setUploadedAudioFile(null); // Clear the file *after successful send*
              setUploadedFileNameForDisplay(null); // Clear display name too
            } else {
              console.error('[App.tsx onOpen] Failed to send meeting data.');
              setWarningMessage('데이터 전송에 실패했습니다. 연결 상태를 확인하고 다시 시도해 주세요.');
              setShowWarning(true);
              resetStateForNewSession();
            }
          } else {
            // This block should ideally not be reached if the useEffect condition is working,
            // but added for robustness and debugging.
            console.error('[App.tsx onOpen] Check failed: uploadedAudioFile or recordInfo missing.', {
              hasAudioFile: !!uploadedAudioFile,
              hasRecordInfo: !!recordInfo,
              processingStarted,
              isRecording
            });
            setWarningMessage('데이터 준비 중 오류가 발생했습니다. 다시 시도해 주세요.');
            setShowWarning(true);
            resetStateForNewSession();
          }
        },
        onClose: (reason?: string) => {
          console.log('[App.tsx onClose] WebSocket Disconnected:', reason);
          setProcessSteps(prevSteps => {
            const finalStepCompleted = prevSteps.find(s => s.id === serverSteps.length)?.status === 'completed';
            if (!finalStepCompleted) {
              console.log('[App.tsx onClose] Resetting state due to unexpected disconnect.');
              setProcessingStarted(false); // Allow re-initiation
            }
            return prevSteps;
          });
        },
        onError: (error: Event) => {
          console.error('[App.tsx onError] WebSocket Error:', error);
          setProcessingStarted(false);
          setProcessSteps(serverSteps.map(step => ({ ...step, status: 'pending' })));
          setCurrentStep(0);
          setWarningMessage('WebSocket 연결 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
          setShowWarning(true);
        },
        onStepUpdate: updateStepStatus, // Pass the stable callback
        onDocumentsReceived: (docs: Document[]) => {
          setDocuments(docs);
          setShowDocumentPanel(true);
        },
        onInsightsReceived: (insights: KeyInsight[]) => {
          setKeyInsights(insights);
          setShowAIInsights(true);
        },
        onHtmlReceived: setGeneratedHtml,
        onSetCurrentStep: setCurrentStep,
        onSetAiHighlightMode: setAiHighlightMode,
        onStatusChange: setConnectionStatus, // Pass the state setter
      };

      console.log("[App.tsx useEffect] Conditions met, connecting WebSocket.", { processingStarted, isRecording, hasRecordInfo: !!recordInfo });
      WebsocketController.connect(callbacks);

      // Cleanup function for when the component unmounts or dependencies change triggering a reconnect/disconnect
      return () => {
        console.log("[App.tsx useEffect cleanup] Disconnecting WebSocket.");
        WebsocketController.disconnect();
      };
    } else if (!processingStarted) {
      // Ensure disconnection if processing stops explicitly
      // console.log("[App.tsx useEffect] processingStarted is false, ensuring disconnection."); // Can be noisy
      WebsocketController.disconnect();
    }
    // Dependencies: Connect/disconnect primarily based on processingStarted.
    // recordInfo is included to ensure we don't try connecting before info is ready.
    // isRecording prevents connection while recording. updateStepStatus is stable.
  }, [processingStarted, isRecording, recordInfo, updateStepStatus]); // Removed uploadedAudioFile


  // PDF Preview Scroll (Adjusted for 5 steps)
  useEffect(() => {
    // Scroll when step 5 is completed and HTML is generated
    if (currentStep === 5 && processSteps.find(s => s.id === 5)?.status === 'completed' && generatedHtml && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, processSteps, generatedHtml]);

  const resetStateForNewSession = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setProcessingStarted(false);
    setCurrentStep(0);
    setShowDocumentPanel(false);
    setActiveLeftSidebar('none');
    setShowAIInsights(false);
    setKeyInsights([]);
    setDocuments([]);
    setGeneratedHtml(null);
    setSentimentData([]);
    setLiveKeywords([]);
    setAiHighlightMode(false);
    setRecordingCompleted(false);
    setShowDocTypePopup(false);
    setSelectedDocTypes([]);
    setProcessSteps(serverSteps.map(step => ({ ...step, status: 'pending' })));
    WebsocketController.disconnect();
    setUploadedAudioFile(null);
    setUploadedFileNameForDisplay(null); // Clear display name
    setCompletionContextMessage(null);
  };

  // Updated to accept the new recordInfo structure for starting live recording
  const handleRecordToggle = (newRecordInfo?: { author: string; participants: string[]; purpose: string; title: string; meeting_info: string }) => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop(); // This will trigger 'onstop'
      }
      setShowStopConfirmation(true); // Still show confirmation for UI consistency
    } else {
      // Start recording
      if (newRecordInfo) { // Called from shared popup confirm for live recording
        resetStateForNewSession();
        setRecordInfo(newRecordInfo);
        console.log('Attempting to start live recording with info:', newRecordInfo);
        setUploadedAudioFile(null);

        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0) {
                setLiveAudioChunks(prev => [...prev, event.data]);
              }
            };
            mediaRecorderRef.current.onstop = () => {
              console.log('MediaRecorder stopped, processing chunks.');
              const audioBlob = new Blob(liveAudioChunks, { type: 'audio/webm' }); // Adjust MIME type if needed
              setUploadedAudioFile(audioBlob);
              setUploadedFileNameForDisplay(`live_recording_${Date.now()}.webm`); // Set a display name for live recording
              setLiveAudioChunks([]); // Reset chunks
              // Stop all tracks on the stream to release the microphone
              stream.getTracks().forEach(track => track.stop());
              console.log('Live recording processed into a Blob:', audioBlob);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            console.log('Live recording started.');
          })
          .catch(err => {
            console.error("Error accessing microphone:", err);
            setWarningMessage(`마이크 접근 오류: ${err.message}`);
            setShowWarning(true);
            resetStateForNewSession(); // Reset if mic access fails
          });
      } else { // Called from RecordButton's "Start Recording" (Mic icon) click
        setUploadedAudioFile(null);
        setRecordInfo(null);
        setIsSharedRecordInfoPopupVisible(true);
      }
    }
  };

  // This function is called by handleSharedPopupConfirm if an uploadedAudioFile exists.
  // Updated to accept the new recordInfo structure
  const processFileUploadConfirmation = (
    file: Blob,
    author: string,
    participants: string[],
    purpose: string,
    title: string,
    meeting_info: string
  ) => {
    // Determine filename for logging/display
    const fileName = file instanceof File ? file.name : uploadedFileNameForDisplay || 'recorded_audio.webm';
    const newRecordInfo = { author, participants, purpose, title, meeting_info };
    console.log('File upload processing (via App.tsx):', { fileName, ...newRecordInfo });
    setRecordInfo(newRecordInfo);
    // Ensure display name is set if it wasn't (e.g., if somehow processFileUploadConfirmation was called directly with a blob)
    if (!uploadedFileNameForDisplay && file instanceof File) {
      setUploadedFileNameForDisplay(file.name);
    } else if (!uploadedFileNameForDisplay) {
      setUploadedFileNameForDisplay('recorded_audio.webm');
    }
    setRecordingCompleted(true); // This transitions UI to "문서 생성"
    setCompletionContextMessage("업로드가 완료되었습니다."); // Set message for file upload
  };


  // New handler for file drop directly in ReportPreview
  const handleFileDropInReportPreview = (file: File) => { // Receives a File object
    console.log('File dropped in ReportPreview:', file.name);
    resetStateForNewSession();
    setUploadedAudioFile(file); // Store the File (which is also a Blob)
    setUploadedFileNameForDisplay(file.name); // Store the name for display
    setRecordInfo(null);
    setIsSharedRecordInfoPopupVisible(true);
  };

  // Shared popup confirm handler - Updated signature
  const handleSharedPopupConfirm = (
    author: string,
    participants: string[],
    purpose: string,
    title: string,
    meeting_info: string
  ) => {
    const newRecordInfo = { author, participants, purpose, title, meeting_info };
    if (uploadedAudioFile) {
      // If a file was set (e.g., from ReportPreview drop, or if RecordButton had a file and triggered this popup)
      processFileUploadConfirmation(uploadedAudioFile, author, participants, purpose, title, meeting_info);
    } else { // No file, so this must be for starting a new live recording
      handleRecordToggle(newRecordInfo); // Call with the full newRecordInfo object
    }
    setIsSharedRecordInfoPopupVisible(false);
  };

  const handleSharedPopupCancel = () => {
    setIsSharedRecordInfoPopupVisible(false);
    // If a file was dropped in ReportPreview and popup was cancelled, uploadedAudioFile is still set.
    // ReportPreview will show its default placeholder.
    // RecordButton will show "회의 정보 입력" if uploadedAudioFile is present.
    // If user then clicks "녹음 시작" on RecordButton, uploadedAudioFile will be cleared.
    // If user clicks "회의 정보 입력" on RecordButton, the popup re-opens for the existing uploadedAudioFile.
    // This seems like reasonable behavior. If we wanted to clear uploadedAudioFile on cancel, we'd do it here.
    // For now, let's keep uploadedAudioFile so "회의 정보 입력" on RecordButton works.
    // Consider: if (uploadedAudioFile && !recordInfo) setUploadedAudioFile(null); // to reset if info was never entered for a dropped file
  };

  const handleConfirmStop = () => {
    // Actual stopping is handled by mediaRecorderRef.current.stop() in handleRecordToggle
    // This function now primarily handles UI update after stop confirmation.
    setIsRecording(false); // Update UI state
    setShowStopConfirmation(false);
    setRecordingCompleted(true);
    setCompletionContextMessage("녹음이 완료되었습니다.");
    // At this point, uploadedAudioFile should have been set by mediaRecorder.onstop
    if (!uploadedAudioFile && liveAudioChunks.length === 0) { // Check if onstop might not have fired or blob is empty
      console.warn("Recording stopped, but no audio data was captured or processed into uploadedAudioFile.");
      // Potentially set a warning or error state here if needed
    }
  };

  const handleStartGeneration = () => {
    setSelectedDocTypes([]);
    setShowDocTypePopup(true);
  };

  const handleConfirmGeneration = () => {
    console.log('Selected document types for generation:', selectedDocTypes);
    if (recordInfo) {
      console.log('Meeting Info for generation:', recordInfo);
    }
    // If !uploadedAudioFile and !isRecording (after stopping), this implies live recording data needs to be handled.
    // For now, the WebSocket useEffect handles uploadedAudioFile. Live recording data path needs clarification.
    // If there's an uploadedAudioFile, it will be sent by the useEffect when processingStarted becomes true.
    // If it was a live recording, the mechanism to get that audio data to WebsocketController.sendAudioData needs to be in place.
    // For this iteration, we assume if uploadedAudioFile is null, the test.mp3 will be sent by the WebSocket logic.
    // This might need refinement if live recorded audio should be sent instead of test.mp3.

    setProcessingStarted(true);
    setShowDocTypePopup(false);
    setRecordingCompleted(false); // Processing has started, so "문서 생성" button should disappear
  };

  // Handler for canceling the document type selection
  const handleCancelGeneration = () => {
    setShowDocTypePopup(false); // Just hide the popup
  };

  // Handler for toggling document type selection
  const handleDocTypeSelectionChange = (typeId: string) => {
    setSelectedDocTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId) // Remove if already selected
        : [...prev, typeId] // Add if not selected
    );
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
    setRecordingCompleted(false); // Reset recording completed state
    setShowDocTypePopup(false); // Ensure doc type popup is hidden on reset
    setSelectedDocTypes([]); // Clear selected doc types on reset
    setProcessSteps(serverSteps.map(step => ({ ...step, status: 'pending' }))); // Reset steps to initial state
    // Close WebSocket connection using the controller
    WebsocketController.disconnect();
    // Optionally re-select the current meeting or default
  };

  // Toggle Right Sidebar Visibility
  const handleToggleRightSidebar = () => {
    setShowDocumentPanel(prev => !prev);
  };

  // Toggle Meeting List Sidebar
  const handleToggleLeftSidebar = () => {
    setActiveLeftSidebar(prev => prev === 'meetingList' ? 'none' : 'meetingList');
  };

  // Toggle Chatbot Sidebar
  const handleToggleChatbotSidebar = () => {
    setActiveLeftSidebar(prev => prev === 'chatbot' ? 'none' : 'chatbot');
  };

  // Calculate dynamic left margin for main content based on single active sidebar
  const calculateLeftMargin = () => {
    if (activeLeftSidebar === 'none') {
      return 'ml-0'; // No margin if no sidebar is active
    }
    return `ml-72`;
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* Left Sidebar Area with Animation - Renders only the active one */}
      <AnimatePresence>
        {/* Chatbot Sidebar */}
        {activeLeftSidebar === 'chatbot' && (
          <motion.div
            key="chatbot-sidebar"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full z-30 w-72" // Apply consistent width here too
          >
            <ChatbotSidebar />
          </motion.div>
        )}

        {/* Meeting List Sidebar */}
        {activeLeftSidebar === 'meetingList' && (
          <motion.div
            key="meeting-list-sidebar"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 h-full z-30 w-72" // No dynamic left needed
          >
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
      {/* Adjust margin based on the single active left sidebar and right sidebar visibility */}
      <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out 
                   ${calculateLeftMargin()} 
                   ${showDocumentPanel ? 'mr-72' : 'mr-0'}`}>
        {/* Use AppHeader Organism - Pass connectionStatus and sidebar toggles */}
        <AppHeader
          isRecording={isRecording}
          recordingTime={recordingTime}
          connectionStatus={connectionStatus} // Pass connection status
          processingStarted={processingStarted}
          aiHighlightMode={aiHighlightMode}
          onToggleAiHighlight={() => setAiHighlightMode(!aiHighlightMode)}
          formatTime={formatTime}
          activeLeftSidebar={activeLeftSidebar} // Pass the active sidebar state
          onToggleLeftSidebar={handleToggleLeftSidebar} // Pass meeting list toggle handler
          onToggleChatbotSidebar={handleToggleChatbotSidebar} // Pass chatbot toggle handler
          showRightSidebar={showDocumentPanel} // Pass right sidebar state
          onToggleRightSidebar={handleToggleRightSidebar} // Pass right sidebar handler
        />

        {/* Conditionally render ProcessStepsBar with animation (Keep original logic) */}
        {/* Determine if the final step is completed for ProcessStepsBar visibility */}
        {(() => {
          const isProcessCompleteForBar = processSteps[serverSteps.length - 1]?.status === 'completed';
          return (
            <AnimatePresence>
              {!isProcessCompleteForBar && (
                <motion.div
                  initial={{ opacity: 1, height: 'auto' }} // Start visible and with auto height
                  exit={{ opacity: 0, height: 0 }} // Fade out and collapse height
                  transition={{ duration: 0.3 }} // Animation duration
                >
                  <ProcessStepsBar processSteps={processSteps} />
                </motion.div>
              )}
            </AnimatePresence>
          );
        })()}
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
            {/* Conditionally render CurrentStepDisplay with animation (Keep original logic) */}
            {(() => {
              const isProcessCompleteForDisplay = processSteps[serverSteps.length - 1]?.status === 'completed';
              return (
                <AnimatePresence>
                  {!isProcessCompleteForDisplay && (
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
              );
            })()}


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
              // recordingCompleted={recordingCompleted} // Removed as it's no longer a prop
              onFileDrop={handleFileDropInReportPreview}
              completionMessage={completionContextMessage} // Pass the new message prop
            />
          </div>
        </div>

        {/* RecordButton now uses App-controlled popup for initiating live recording */}
        <RecordButton
          isRecording={isRecording}
          processingStarted={processingStarted}
          recordingCompleted={recordingCompleted}
          onToggleRecord={handleRecordToggle} // Handles start/stop of live recording (shows popup for start)
          onStartGeneration={handleStartGeneration}
          initialUploadedFileName={uploadedFileNameForDisplay} // Use the dedicated display name state
          onRequestShowInfoPopup={() => {
            // If called, it's from "회의 정보 입력" button.
            // uploadedAudioFile should already be set from a previous ReportPreview drop.
            // If not, it's an edge case, but opening popup is fine.
            if (!uploadedAudioFile) {
              console.warn("onRequestShowInfoPopup called but no uploadedAudioFile is set. This might be an issue.");
              // Default to live recording flow if no file is somehow present
              setUploadedAudioFile(null);
            }
            setIsSharedRecordInfoPopupVisible(true);
          }}
        />
      </div>

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
        title="녹음 종료 확인" // Changed title
        message="녹음을 종료하시겠습니까?" // Changed message
        confirmText="종료" // Changed confirm text
        cancelText="취소"
        onConfirm={handleConfirmStop}
        onCancel={handleCancelStop}
      />

      {/* Document Type Selection Popup */}
      <DocumentTypeSelectionPopup
        isVisible={showDocTypePopup}
        selectedTypes={selectedDocTypes}
        onSelectionChange={handleDocTypeSelectionChange}
        onConfirm={handleConfirmGeneration}
        onCancel={handleCancelGeneration}
      />

      {/* Shared RecordInfoPopup controlled by App.tsx */}
      <RecordInfoPopup
        isVisible={isSharedRecordInfoPopupVisible}
        onConfirm={handleSharedPopupConfirm}
        onCancel={handleSharedPopupCancel}
        confirmButtonText={uploadedAudioFile ? "확인" : "녹음 시작"} // Dynamic button text
      // Optionally pass initialTitle if uploadedAudioFile is set and popup is for it
      // initialTitle={uploadedAudioFile ? uploadedAudioFile.name.split('.').slice(0, -1).join('.') : undefined}
      />
    </div>
  );
};

export default App;
