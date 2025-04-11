/* cspell:disable */
/// <reference lib="webworker" />

importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');

interface MessagingPayload {
    notification?: {
        title?: string;
        body?: string;
        image?: string;
        icon?: string;
    };
}
interface Messaging {
    onBackgroundMessage: (callback: (payload: MessagingPayload) => void) => void;
}
interface FirebaseApp {
    messaging: () => Messaging;
}

declare let self: ServiceWorkerGlobalScope & {
    firebase: {
        initializeApp: (config: Record<string, string | undefined>) => FirebaseApp;
        messaging: () => {
            onBackgroundMessage: (callback: (payload: any) => void) => void;
        };
    };
};

self.firebase.initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});
const messaging = self.firebase.messaging();

const linkRecord: Record<string, string | undefined> = {};

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase] Background message received');
    if (!payload.notification) return;

    const notificationTitle = payload.notification.title || 'Firefly';

    linkRecord[`${notificationTitle}-${payload.notification.body}`] = payload.data?.link;
    self.registration.showNotification(notificationTitle, {
        ...payload.notification,
        icon: '/android-chrome-144x144.png',
    });
});

self.addEventListener('notificationclick', (event) => {
    const recordKey = `${event.notification.title}-${event.notification.body}`;
    const link = linkRecord[recordKey] || '/';

    linkRecord[recordKey] = undefined;
    event.notification.close();
    event.waitUntil(
        self.clients
            .matchAll({
                type: 'window',
            })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === link && 'focus' in client) return client.focus();
                }
                if (typeof self.clients.openWindow === 'function') return self.clients.openWindow(link);
            }),
    );
});

export {};
