// src/pushUtils.ts
import axios from "axios";
import { PushSubscriptionJSON } from "../types";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEBPUSH_PUBLIC_KEY;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!VAPID_PUBLIC_KEY) {
    console.error("VITE_WEBPUSH_PUBLIC_KEY가 .env 파일에 설정되지 않았습니다.");
}
if (!API_BASE_URL) {
    console.error("VITE_API_BASE_URL이 .env 파일에 설정되지 않았습니다.");
}

/**
 * URL-safe Base64 문자열을 Uint8Array로 변환.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * 구독 정보를 서버로 전송합니다.
 */
async function sendSubscriptionToServer(subscriptionJSON: PushSubscriptionJSON): Promise<void> {
    if (!API_BASE_URL) {
        console.error("API_BASE_URL이 설정되지 않아 구독 정보를 서버로 전송할 수 없습니다.");
        throw new Error("API_BASE_URL is not configured.");
    }
    await axios.post<PushSubscriptionJSON>(`${API_BASE_URL}/subscribe`, subscriptionJSON, {
        headers: { "Content-Type": "application/json" },
    });
    console.log("구독 정보가 서버로 성공적으로 전송되었습니다:", subscriptionJSON.endpoint);
}

/**
 * 브라우저의 PushSubscriptionJSON을 애플리케이션의 PushSubscriptionJSON 타입으로 변환하고 유효성을 검사합니다.
 * @param browserSubJSON - 브라우저의 subscription.toJSON() 결과 객체
 * @returns 애플리케이션의 PushSubscriptionJSON 타입 객체 또는 null (유효하지 않은 경우)
 */
function toAppPushSubscriptionJSON(browserSubJSON: globalThis.PushSubscriptionJSON): PushSubscriptionJSON | null {
    if (!browserSubJSON.endpoint || !browserSubJSON.keys || !browserSubJSON.keys.p256dh || !browserSubJSON.keys.auth) {
        console.error("브라우저 Push 구독 JSON에 필수 필드가 누락되었습니다:", browserSubJSON);
        return null;
    }
    return {
        endpoint: browserSubJSON.endpoint,
        expirationTime: browserSubJSON.expirationTime !== undefined ? browserSubJSON.expirationTime : null,
        keys: {
            p256dh: browserSubJSON.keys.p256dh,
            auth: browserSubJSON.keys.auth,
        },
    };
}

/**
 * Service Worker 등록 및 Push Subscription 구독 수행 후,
 * 서버의 /subscribe 엔드포인트에 구독 정보 전송
 */
export async function registerServiceWorkerAndSubscribe(): Promise<PushSubscriptionJSON | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Service Worker 또는 Push Manager가 이 브라우저에서 지원되지 않습니다.");
        return null;
    }
    if (!VAPID_PUBLIC_KEY) {
        console.error("VAPID 공개 키가 설정되지 않아 Push 구독을 진행할 수 없습니다.");
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        console.log("Service Worker 등록 성공. 범위:", registration.scope);

        // 기존 구독 확인
        let pushSubscription = await registration.pushManager.getSubscription();
        if (pushSubscription) {
            console.log("기존 Push 구독 정보 발견:", pushSubscription.endpoint);
            const appSubscriptionJSON = toAppPushSubscriptionJSON(pushSubscription.toJSON());
            if (!appSubscriptionJSON) {
                console.error("기존 구독 정보가 유효하지 않은 형식입니다. 새로 구독을 시도합니다.");
                // 유효하지 않으면 새 구독으로 진행하도록 null을 반환하지 않고 넘어감
            } else {
                try {
                    await sendSubscriptionToServer(appSubscriptionJSON);
                } catch (syncError) {
                    console.error("기존 구독 정보 서버 동기화 실패:", syncError);
                    // 동기화 실패 시에도 로컬 구독은 유효하므로 계속 진행
                }
                return appSubscriptionJSON;
            }
        }

        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("알림 권한이 거부되었습니다.");
            return null;
        }

        // 새 Push 구독 수행
        console.log("새로운 Push 구독을 시도합니다...");
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
        });

        const appSubscriptionJSON = toAppPushSubscriptionJSON(pushSubscription.toJSON());
        if (!appSubscriptionJSON) {
            console.error("새로 생성된 Push 구독 정보가 유효하지 않은 형식입니다.");
            return null;
        }

        console.log("새로운 Push 구독 성공:", appSubscriptionJSON.endpoint);
        await sendSubscriptionToServer(appSubscriptionJSON);
        return appSubscriptionJSON;

    } catch (error) {
        console.error("Service Worker 등록 또는 Push 구독 중 오류 발생:", error);
        // 사용자에게 오류를 알리는 UI를 표시하는 것을 고려할 수 있습니다.
        if (error instanceof Error && error.name === 'InvalidStateError') {
            console.error("InvalidStateError: VAPID 공개 키가 유효하지 않거나 형식이 잘못되었을 수 있습니다. .env 파일을 확인하세요.");
        }
        return null;
    }
}

/**
 * Push 알림 구독을 해지하고 서버에 알립니다.
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Service Worker 또는 Push Manager가 지원되지 않아 구독 해지를 진행할 수 없습니다.");
        return false;
    }
    if (!API_BASE_URL) {
        console.error("API_BASE_URL이 설정되지 않아 구독 해지 정보를 서버로 전송할 수 없습니다.");
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready; // 활성화된 서비스 워커를 기다림
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            console.log("활성화된 Push 구독이 없습니다. 해지할 필요가 없습니다.");
            return true; // 이미 구독되지 않은 상태도 성공으로 간주
        }

        const endpoint = subscription.endpoint;
        const unSubscribed = await subscription.unsubscribe();

        if (unSubscribed) {
            console.log("Push 구독이 성공적으로 해지되었습니다:", endpoint);
            // 서버에 구독 해지 알림
            try {
                await axios.post(`${API_BASE_URL}/unsubscribe`, { endpoint }, {
                    headers: { "Content-Type": "application/json" },
                });
                console.log("구독 해지 정보가 서버로 전송되었습니다.");
            } catch (serverError) {
                console.error("서버로 구독 해지 정보 전송 중 오류 발생:", serverError);
                // 로컬에서는 해지되었으므로 true 반환, 서버 문제는 별도 처리 필요
            }
            return true;
        } else {
            console.error("Push 구독 해지에 실패했습니다.");
            // 사용자에게 오류를 알리는 UI를 표시하는 것을 고려할 수 있습니다.
            return false;
        }
    } catch (error) {
        console.error("Push 구독 해지 중 오류 발생:", error);
        // 사용자에게 오류를 알리는 UI를 표시하는 것을 고려할 수 있습니다.
        return false;
    }
}
