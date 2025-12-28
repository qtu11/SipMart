// Service Worker cho Firebase Cloud Messaging
// File này phải ở trong thư mục public

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config từ environment variables
// Lưu ý: Service worker không có access đến process.env
// Nên cần hardcode hoặc inject từ server
const firebaseConfig = {
  apiKey: "AIzaSyCQei_w8Gpe_8m6_yPLmAnG6YNXN6C9zuI", // Sẽ được inject từ server
  authDomain: "cupsipsmart.firebaseapp.com",
  projectId: "cupsipsmart",
  storageBucket: "cupsipsmart.firebasestorage.app",
  messagingSenderId: "198174221362",
  appId: "1:198174221362:web:920f384abb62affe87482b",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'CupSipMart';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png', // Có thể thay bằng logo của bạn
    badge: '/icon-192x192.png',
    tag: payload.data?.notificationId || 'cupsipmart',
    data: payload.data || {},
    requireInteraction: false,
    silent: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Mở hoặc focus vào app
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Kiểm tra xem đã có window mở chưa
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Nếu chưa có, mở window mới
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

