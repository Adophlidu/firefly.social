/* cspell:disable */
/// <reference lib="webworker" />

importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics-compat.js');

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

interface MessagePayload {
    from: string;
    messageId: string;
    notification: {
        title: string;
        body: string;
    };
    data: {
        link: string;
        msgid: string;
    };
    fcmOptions: {
        /** The same as `link` in `data`. */
        link: string;
    };
}

declare let self: ServiceWorkerGlobalScope & {
    firebase: {
        initializeApp: (config: Record<string, string | undefined>) => FirebaseApp;
        messaging: () => {
            onBackgroundMessage: (callback: (payload: any) => void) => void;
        };
        analytics: () => {
            logEvent: (
                eventName: string,
                params?: {
                    [key: string]: any;
                },
            ) => void;
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
const analytics = self.firebase.analytics();

messaging.onBackgroundMessage((payload: MessagePayload) => {
    analytics.logEvent('notification_background', payload);
    console.log('[firebase] Background message received');
    if (!payload.notification) return;

    const notificationTitle = payload.notification.title || 'Firefly';

    self.registration.showNotification(notificationTitle, {
        ...payload.notification,
        icon: '/android-chrome-144x144.png',
        data: { link: payload.data.link },
    });
});

self.addEventListener('notificationclick', (event) => {
    analytics.logEvent('notification_background_click', event.notification.data);
    const link = event.notification.data?.link;

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
