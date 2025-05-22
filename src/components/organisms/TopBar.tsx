import React from 'react';
import Icon from '../atoms/Icon';
import { Share2, Settings, Menu } from 'lucide-react';

const TopBar: React.FC = () => {
    return (
        <header className="bg-transparent flex items-center justify-between px-8 py-2">
            <div className="flex items-center gap-3">
                {/* 로고/아이콘 */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">자</span>
                </div>
                <span className="text-xl font-bold" style={{ color: '#22292f' }}>Woori NoteBook</span>
            </div>
            <div className="flex items-center gap-2">
                <button className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 transition" aria-label="Share">
                    <Icon icon={Share2} size={20} />
                </button>
                <button className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 transition" aria-label="Settings">
                    <Icon icon={Settings} size={20} />
                </button>
                <button className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 transition" aria-label="Menu">
                    <Icon icon={Menu} size={20} />
                </button>
                <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base ml-2">재우</div>
            </div>
        </header>
    );
};

export default TopBar;
