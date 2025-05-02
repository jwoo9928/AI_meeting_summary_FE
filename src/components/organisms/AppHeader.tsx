import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Wifi, WifiOff, PanelRightOpen, PanelRightClose, PanelLeftOpen, PanelLeftClose, MessageSquare } from 'lucide-react'; // Import Wifi, Panel, and MessageSquare icons
import { ConnectionStatus } from '../../controllers/WebsocketController'; // Import ConnectionStatus type

type AppHeaderProps = {
    isRecording: boolean;
    recordingTime: number;
    connectionStatus: ConnectionStatus; // Add connectionStatus prop
    processingStarted: boolean;
    aiHighlightMode: boolean;
    onToggleAiHighlight: () => void;
    formatTime: (seconds: number) => string;
    // showLeftSidebar: boolean; // REMOVED
    onToggleLeftSidebar: () => void; // Keep handler for meeting list toggle
    showRightSidebar: boolean; // Add prop for right sidebar state
    onToggleRightSidebar: () => void; // Add handler for right sidebar
    // showChatbotSidebar: boolean; // REMOVED
    onToggleChatbotSidebar: () => void; // Keep handler for chatbot toggle
    activeLeftSidebar: 'meetingList' | 'chatbot' | 'none'; // Add prop for active sidebar state
};

const AppHeader: React.FC<AppHeaderProps> = ({
    isRecording,
    recordingTime,
    processingStarted,
    aiHighlightMode,
    onToggleAiHighlight,
    formatTime,
    connectionStatus,
    // showLeftSidebar, // REMOVED
    onToggleLeftSidebar, // Keep handler
    // showChatbotSidebar, // REMOVED
    onToggleChatbotSidebar, // Keep handler
    activeLeftSidebar, // Destructure active sidebar state
    showRightSidebar, // Destructure right sidebar props
    onToggleRightSidebar, // Destructure right sidebar props
}) => {
    const renderConnectionIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                // Wrap icon in a span with title for tooltip
                return <span title="WebSocket Connected"><Wifi size={18} className="text-green-500 ml-2" /></span>;
            case 'connecting':
                // Wrap icon in a span with title for tooltip
                return <span title="WebSocket Connecting"><Wifi size={18} className="text-yellow-500 ml-2 animate-pulse" /></span>;
            case 'error':
            case 'disconnected':
                // Wrap icon in a span with title for tooltip
                return <span title="WebSocket Disconnected/Error"><WifiOff size={18} className="text-red-500 ml-2" /></span>;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 py-3 sticky top-0 z-20 shadow-sm"> {/* Increased z-index */}
            <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center">
                    {/* Chatbot Sidebar Toggle Button */}
                    <button
                        onClick={onToggleChatbotSidebar}
                        className={`p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors mr-2 ${activeLeftSidebar === 'chatbot' ? 'bg-blue-100 text-blue-600' : ''}`}
                        aria-label={activeLeftSidebar === 'chatbot' ? "Hide chatbot" : "Show chatbot"}
                    >
                        <MessageSquare size={20} />
                    </button>
                    {/* Meeting List Sidebar Toggle Button */}
                    <button
                        onClick={onToggleLeftSidebar}
                        className={`p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors mr-4 ${activeLeftSidebar === 'meetingList' ? 'bg-gray-200' : ''}`}
                        aria-label={activeLeftSidebar === 'meetingList' ? "Hide meeting list" : "Show meeting list"}
                    >
                        {/* Use different icons based on active state? Or just background color? */}
                        {/* For now, just use background color to indicate active */}
                        {activeLeftSidebar === 'meetingList' ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                    </button>
                    <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                        <span>회의 녹음 및 분석</span>
                        {renderConnectionIcon()} {/* Render the connection icon */}
                    </h1>
                    {/* AI Highlight Toggle */}
                    {processingStarted && !isRecording && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className={`ml-5 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center transition-all border ${aiHighlightMode
                                ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                }`}
                            onClick={onToggleAiHighlight}
                        >
                            <Zap size={14} className={`mr-1.5 ${aiHighlightMode ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span>AI 강조 모드 {aiHighlightMode ? 'ON' : 'OFF'}</span>
                        </motion.button>
                    )}
                </div>

                {/* Recording Status */}
                {isRecording && (
                    <div className="flex items-center px-4 py-1.5 rounded-full bg-red-50 border border-red-200 shadow-sm">
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop' }}
                            className="h-2.5 w-2.5 bg-red-500 rounded-full mr-2.5"
                        />
                        <span className="text-sm font-medium text-red-600">{formatTime(recordingTime)}</span>
                    </div>
                )}

                {/* Right Sidebar Toggle Button */}
                <button
                    onClick={onToggleRightSidebar}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                    aria-label={showRightSidebar ? "Hide document panel" : "Show document panel"}
                >
                    {showRightSidebar ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
            </div>
        </div>
    );
};

export default AppHeader;
