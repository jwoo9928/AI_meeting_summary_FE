import React from 'react';
import { PromptInputWithActions } from "../molecules/PromptInput";
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Message, MessageAvatar, MessageContent } from '../ui/message';
import { Reasoning } from '../ui/reasoning';
import ReasoningBasic from '../molecules/Reasoning';

interface ChatPanelProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isCollapsed, onToggleCollapse }) => {
    return (
        <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Chat</h2>
                <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close Chat"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 채팅 내용 */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-8">
                    <ReasoningBasic />
                    <Message className="justify-end">
                        <MessageContent>Hello! How can I help you today?</MessageContent>
                    </Message>

                    <Message className="justify-start">
                        <MessageAvatar src="/avatars/ai.png" alt="AI" fallback="AI" />
                        <MessageContent markdown className="bg-transparent p-0">
                            I can help with a variety of tasks: answering questions, providing
                            information, assisting with coding, generating creative content. What
                            would you like help with today?
                        </MessageContent>
                    </Message>
                </div>
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t">
                <PromptInputWithActions />
            </div>
        </div>
    );
};

export default ChatPanel;