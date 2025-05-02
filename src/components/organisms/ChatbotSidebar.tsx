import React from 'react';
import { Send } from 'lucide-react'; // Import Send and a chat icon

const ChatbotSidebar: React.FC = () => {
    // TODO: Add state management for chat messages and input
    // TODO: Implement logic for interacting with the document
    // TODO: Add animations for new messages appearing (e.g., using framer-motion)

    return (
        // Harmonized styles with MeetingListSidebar: w-72, h-full, bg-white, border-gray-200, p-4, shadow-sm
        <div className="chatbot-sidebar w-72 h-full bg-white border-r border-gray-200 p-4 flex flex-col space-y-4 shadow-sm">
            {/* Title with icon and softer text - Kept internal styling */}
            <div className="flex items-center space-x-2 px-2"> {/* Added px-2 to align title like MeetingListSidebar */}
                <h2 className="text-lg font-semibold text-gray-800">문서 작성 어시스턴트</h2> {/* Matched font size/weight/color */}
            </div>

            {/* Chat messages display area - Kept internal styling but adjusted container */}
            <div
                className="chat-messages flex-grow overflow-y-auto space-y-3 flex flex-col rounded-md" // Adjusted padding, bg, border slightly for consistency
            >
                {/* Placeholder */}

                {/* Example message structure - Cuter bubbles */}
                {/* User Message */}
                <div className="flex justify-end group animate-fade-in"> {/* Added basic fade-in animation class (needs definition in CSS) */}
                    <div className="bg-blue-500 text-white py-2.5 px-4 rounded-t-xl rounded-l-xl max-w-[85%] shadow-md transition-transform duration-200 ease-out group-hover:scale-[1.02]">
                        시스템 개요에 근거가 부족해. 추가로 자료를 조사해서 보완해줘.
                    </div>
                </div>
                {/* Bot Message */}
                <div className="flex justify-start group animate-fade-in"> {/* Added basic fade-in animation class */}
                    <div className="bg-gray-100 text-gray-800 py-2.5 px-4 rounded-t-xl rounded-r-xl max-w-[85%] border border-gray-200 shadow-md transition-transform duration-200 ease-out group-hover:scale-[1.02]">
                        네. 알겠습니다. 관련 문서를 탐색하겠습니다.
                    </div>
                </div>
                {/* Add more example messages if needed */}
            </div>

            {/* Chat input area - Kept internal styling but adjusted container */}
            <div className="chat-input flex items-center space-x-2 border-t border-gray-200 pt-3"> {/* Matched border, adjusted padding */}
                <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm shadow-sm" // Reverted to simpler input style for now
                />
                <button
                    className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors shadow-sm" // Reverted to simpler button style
                    aria-label="Send message"
                >
                    <Send size={20} /> {/* Matched original icon size */}
                </button>
            </div>
        </div>
    );
};

// Add basic fade-in animation if not using a library like framer-motion
// You might need to add this to your global CSS (e.g., index.css)
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
*/

export default ChatbotSidebar;
