import React, { useState } from 'react';
import Icon from '../atoms/Icon';
import { Share2, Settings, Menu, Bell, BellOff } from 'lucide-react';
import { PushSubscriptionJSON } from '../../types'; // Assuming types.ts is in src

interface TopBarProps {
    currentSubscription: PushSubscriptionJSON | null;
    pushNotificationStatus: string;
    onSubscribe: () => Promise<void>;
    onUnsubscribe: () => Promise<void>;
}

const TopBar: React.FC<TopBarProps> = ({
    currentSubscription,
    pushNotificationStatus,
    onSubscribe,
    onUnsubscribe
}) => {
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const handleNotificationIconClick = () => {
        if (currentSubscription) {
            onUnsubscribe();
        } else if (Notification.permission !== "denied") {
            onSubscribe();
        }
        // If permission is denied, clicking does nothing, tooltip explains.
    };

    let NotificationIconComponent = BellOff;
    let iconColor = "text-gray-500"; // Default for BellOff or denied
    let title = pushNotificationStatus;

    if (currentSubscription) {
        NotificationIconComponent = Bell;
        iconColor = "text-green-500"; // Subscribed
        title = `알림 구독 중. 클릭하여 해지. (${pushNotificationStatus})`;
    } else if (Notification.permission === "denied") {
        NotificationIconComponent = BellOff;
        iconColor = "text-red-500"; // Denied
        title = "알림 권한이 차단되었습니다. 브라우저 설정을 확인하세요.";
    } else if (Notification.permission === "default") {
        NotificationIconComponent = BellOff;
        iconColor = "text-yellow-500"; // Default, can subscribe
        title = "알림이 구독되지 않았습니다. 클릭하여 구독하세요.";
    }


    return (
        <header className="bg-transparent flex items-center justify-between px-8 py-2">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">자</span>
                </div>
                <span className="text-xl font-bold" style={{ color: '#22292f' }}>Woori NoteBook</span>
            </div>
            <div className="flex items-center gap-2">
                {/* Push Notification Icon */}
                <div className="relative">
                    <button
                        onClick={handleNotificationIconClick}
                        onMouseEnter={() => setIsTooltipVisible(true)}
                        onMouseLeave={() => setIsTooltipVisible(false)}
                        className={`rounded-full bg-gray-100 hover:bg-gray-200 p-2 transition ${Notification.permission === "denied" ? "cursor-not-allowed" : ""}`}
                        aria-label="Push Notifications"
                        title={title} // Native tooltip for accessibility
                    >
                        <Icon icon={NotificationIconComponent} size={20} className={iconColor} />
                    </button>
                    {isTooltipVisible && (
                        <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg p-2 text-xs z-50">
                            {pushNotificationStatus}
                            {!currentSubscription && Notification.permission !== "denied" && (
                                <button
                                    onClick={onSubscribe}
                                    className="mt-1 w-full px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs flex items-center justify-center"
                                >
                                    <Bell size={14} className="mr-1" /> 알림 구독
                                </button>
                            )}
                            {currentSubscription && (
                                <button
                                    onClick={onUnsubscribe}
                                    className="mt-1 w-full px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs flex items-center justify-center"
                                >
                                    <BellOff size={14} className="mr-1" /> 알림 해지
                                </button>
                            )}
                        </div>
                    )}
                </div>

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
