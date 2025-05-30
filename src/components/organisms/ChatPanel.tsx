import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { PromptInputWithActions } from "../molecules/PromptInput";
import { X } from 'lucide-react';
import { Message, MessageAvatar, MessageContent } from '../ui/message';
import APIController from '../../controllers/APIController';
import { processDataResponseAtom, parsedMeetingInfoAtom } from '../../store/atoms';
import { ChatMessage, MeetingContext } from '../../types';
import { streamToAsyncIterable } from '../../lib/utils';
import { Reasoning, ReasoningContent, ReasoningTrigger } from '../ui/reasoning';
import { Loader } from '../ui/loader';
import { Markdown } from '../ui/markdown';

interface ChatPanelProps {
    onToggleCollapse: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onToggleCollapse }) => { // Removed isCollapsed from destructuring
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(true); // State to manage panel open/close
    // To keep track of active streams and avoid processing them multiple times
    const activeStreamsRef = useRef<Set<string>>(new Set());

    const processDataResponse = useAtomValue(processDataResponseAtom);
    const parsedMeetingInfo = useAtomValue(parsedMeetingInfoAtom);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to bottom when new messages are added
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Effect to process active streams
    useEffect(() => {
        messages.forEach(async (msg) => {
            if (msg.sender === 'ai' && msg.isStreaming && msg.content === '' && !activeStreamsRef.current.has(msg.id)) {
                // This is a new AI message that needs its stream processed.
                // The actual stream source needs to be obtained from where it was stored when handleSendPrompt created it.
                // For simplicity, let's assume handleSendPrompt will now pass the stream to a temporary holder or re-fetch.
                // This part needs careful implementation based on how stream is passed from handleSendPrompt.
                // The current ChatMessage interface doesn't hold the stream source directly.
                // Let's adjust handleSendPrompt to initiate the streaming into the message content directly.
            }
        });
    }, [messages]);


    const handleSendPrompt = useCallback(async (promptText: string, files?: File[]) => {
        if ((!promptText.trim() && (!files || files.length === 0)) || isLoading) return;

        // TODO: Handle file uploads if files are provided. For now, just logging.
        if (files && files.length > 0) {
            console.log("Files to upload:", files);
        }

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: 'user',
            content: promptText,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const sessionId = processDataResponse?.origin_file.doc_id; // Reverted hardcoded sessionId
        if (!sessionId) {
            console.error("Session ID (doc_id from origin_file) is missing.");
            const aiErrorMessage: ChatMessage = {
                id: `ai-error-${Date.now()}`,
                sender: 'ai',
                content: "Error: Cannot start chat. Document information is missing.",
            };
            setMessages(prev => [...prev, aiErrorMessage]);
            setIsLoading(false);
            return;
        }

        // Construct MeetingContext carefully, providing fallbacks
        const meetingContext: MeetingContext = {
            hub_meeting_id: parsedMeetingInfo?.hub_meeting_id || processDataResponse?.origin_file?.doc_id,
            hub_meeting_title: processDataResponse?.origin_file?.file_name || "Untitled Document",
            hub_participant_names: parsedMeetingInfo?.hub_participant_names || [],
            hub_minutes_s3_url: processDataResponse?.origin_file?.doc_id || "",
        };

        // Add AI message placeholder
        const aiMessageId = `ai-${Date.now()}`;
        const aiPlaceholderMessage: ChatMessage = {
            id: aiMessageId,
            sender: 'ai',
            content: '', // Start with empty content
            reasoning: '',
            isStreaming: true,
        };
        setMessages(prev => [...prev, aiPlaceholderMessage]);
        activeStreamsRef.current.add(aiMessageId); // Mark as active

        try {
            const stream = await APIController.chatWithAI(promptText, sessionId, meetingContext);
            if (stream) {
                const asyncIterableStream = streamToAsyncIterable(stream);
                let accumulatedContent = '';
                for await (const chunk of asyncIterableStream) {
                    console.log("Received chunk:", chunk);
                    accumulatedContent += chunk;
                    const [reason, content] = accumulatedContent.split("</think>")
                    if (content) {
                        setIsOpen(false);
                    }
                    setMessages(prev =>
                        prev.map(m =>
                            m.id === aiMessageId ? {
                                ...m,
                                reasoning: reason.replace('<think>', '') || '',
                                content: content || ''
                            } : m
                        )
                    );
                }
                // Stream finished
                setMessages(prev =>
                    prev.map(m =>
                        m.id === aiMessageId ? { ...m, isStreaming: false } : m
                    )
                );
                activeStreamsRef.current.delete(aiMessageId);
                setIsLoading(false);
            } else {
                throw new Error("Received null stream from APIController");
            }
        } catch (error) {
            console.error("Error calling chatWithAI:", error);
            const errorMessageContent = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev =>
                prev.map(m =>
                    m.id === aiMessageId
                        ? { ...m, content: `Error: ${errorMessageContent}`, isStreaming: false }
                        : m
                )
            );
            activeStreamsRef.current.delete(aiMessageId);
            setIsLoading(false);
        }
    }, [isLoading, processDataResponse, parsedMeetingInfo, setMessages]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Chat</h2>
                <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close Chat"
                >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Chat Content */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <Message key={msg.id} className={msg.sender === 'user' ? 'justify-end' : 'justify-start'}>
                        {msg.sender === 'ai' && (
                            <MessageAvatar src="/avatars/ai.png" alt="AI" fallback="AI" className="mr-2" />
                        )}
                        <div className="flex flex-col gap-2">
                            {msg.sender === 'ai' && (msg.reasoning ?
                                <Reasoning open={isOpen} onOpenChange={(open: boolean) => {
                                    setIsOpen(open); // Toggle open state
                                }} >
                                    <div className="flex w-full flex-col gap-3">
                                        <p className="text-base">I calculated the best color balance</p>
                                        <ReasoningTrigger>Show reasoning</ReasoningTrigger>
                                        <ReasoningContent className="ml-2 border-l-2 border-l-slate-200 px-2 pb-1 dark:border-l-slate-700">
                                            <Markdown className="text-sm text-gray-600 dark:text-gray-400">{msg.reasoning}</Markdown>
                                        </ReasoningContent>
                                    </div>
                                </Reasoning> : <Loader className="text-gray-800 dark:text-gray-200" variant={"loading-dots"} />
                            )}
                            <MessageContent
                                markdown={false} // Markdown component used explicitly below
                                className={`w-full ${msg.sender === 'user' ? 'text-white' : 'bg-transparent text-gray-800 dark:text-gray-200 max-w-[calc(100%-5rem)]'}`}
                            >
                                <Markdown className="text-sm">{msg.content}</Markdown>
                            </MessageContent>
                        </div>
                        {/* User avatar should be a sibling to MessageContent, like AI avatar */}
                    </Message>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <PromptInputWithActions onSend={handleSendPrompt} disabled={isLoading} />
            </div>
        </div>
    );
};

export default ChatPanel;
