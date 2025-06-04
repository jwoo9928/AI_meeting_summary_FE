/// <reference lib="webworker" />

console.log("SW.js 로드됨 - v2"); // SW 등록 시점에 이 로그가 떠야 합니다.

// 서비스 워커 설치 단계
self.addEventListener("install", (event) => {
  console.log("SW: install event");
  event.waitUntil(self.skipWaiting()); // 새 서비스 워커를 즉시 활성화
});

// 서비스 워커 활성화 단계
self.addEventListener("activate", (event) => {
  console.log("SW: activate event");
  event.waitUntil(self.clients.claim()); // 현재 열려있는 클라이언트 제어권 확보
});

self.addEventListener("push", (event) => {
  console.log("SW: Push event received:", event);

  let payload = {
    title: "새 알림",
    body: "새로운 메시지가 도착했습니다.",
    icon: "/vite.svg", // 기본 아이콘
    data: {
      url: "/", // 클릭 시 이동할 기본 URL
    },
  };

  if (event.data) {
    try {
      const incomingPayload = event.data.json();
      payload = { ...payload, ...incomingPayload };
      // 만약 서버에서 data 객체 안에 url을 포함하여 보낸다면, 해당 url을 사용
      if (incomingPayload.data && incomingPayload.data.url) {
        payload.data.url = incomingPayload.data.url;
      }
    } catch (e) {
      console.error(
        "SW: Failed to parse push data as JSON, treating as text.",
        e
      );
      payload.body = event.data.text();
    }
  } else {
    console.log("SW: Push event contained no data.");
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: "/vite.svg", // Android에서 알림 아이콘 옆에 표시될 작은 아이콘
    vibrate: [200, 100, 200], // 진동 패턴
    data: payload.data, // 알림과 함께 저장할 데이터 (예: 클릭 시 이동할 URL)
    actions: [
      // 사용자 정의 액션 버튼 (선택 사항)
      // { action: 'explore', title: '자세히 보기', icon: '/icons/explore.png' },
      // { action: 'close', title: '닫기', icon: '/icons/close.png' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  console.log("SW: Notification click Received.", event.notification);
  event.notification.close(); // 알림 닫기

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || "/"; // 페이로드에 포함된 URL 또는 기본 URL

  // 특정 액션 버튼 클릭 처리 (선택 사항)
  // if (event.action === 'explore') {
  //   // '자세히 보기' 버튼 클릭 시 동작
  //   console.log('SW: Explore action clicked');
  //   // event.waitUntil(self.clients.openWindow('/explore-link'));
  // } else if (event.action === 'close') {
  //   // '닫기' 버튼은 자동으로 알림을 닫으므로 별도 처리 불필요
  //   console.log('SW: Close action clicked');
  // } else {
  //   // 알림 본문 클릭 시 동작
  //   console.log('SW: Notification body clicked');
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 이미 해당 URL을 가진 탭이 열려있는지 확인
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus(); // 해당 탭으로 포커스
          }
        }
        // 열려있는 탭이 없으면 새 탭에서 URL 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
  // }
});

self.addEventListener("notificationclose", (event) => {
  console.log("SW: Notification was closed", event.notification);
  // 사용자가 알림을 클릭하지 않고 닫았을 때의 로직 (예: 분석 데이터 전송)
});

self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("SW: Push subscription changed event triggered.", event);
  // 구독 정보가 변경되었을 때 (예: 만료, 브라우저에 의한 취소 등)
  // 여기서 새로운 구독 정보를 서버로 다시 보내는 로직을 구현해야 합니다.
  // 예: event.waitUntil(self.registration.pushManager.subscribe(options).then(subscription => sendSubscriptionToServer(subscription)));
  // 실제 구현 시에는 VAPID 키와 서버 전송 로직이 필요합니다.
  // 지금은 콘솔에 로그만 남깁니다.
  console.warn(
    "SW: Subscription needs to be updated on the server. Implement re-subscription logic."
  );
  //   event.waitUntil(
  //     self.registration.pushManager.subscribe(event.oldSubscription.options)
  //     .then(subscription => {
  //       // TODO: 서버로 새 구독 정보 전송 로직 구현
  //       // return fetch('/update-subscription', {
  //       //   method: 'POST',
  //       //   headers: { 'Content-Type': 'application/json' },
  //       //   body: JSON.stringify(subscription),
  //       // });
  //       console.log('SW: New subscription obtained:', subscription);
  //     })
  //   );
});
