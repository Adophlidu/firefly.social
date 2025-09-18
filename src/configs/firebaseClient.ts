import { type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app';
import { getMessaging, type Messaging, onMessage } from 'firebase/messaging';

import { env } from '@/constants/env.js';
import { SITE_NAME } from '@/constants/index.js';
import { parseUrl } from '@/helpers/parseUrl.js';

function createFirebaseApp() {
    const firebaseConfig: FirebaseOptions = {
        apiKey: env.external.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.external.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.external.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: env.external.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.external.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.external.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: env.external.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    const invalidKeys = (Object.keys(firebaseConfig) as Array<keyof FirebaseOptions>).filter(
        (key) => !firebaseConfig[key],
    );
    if (invalidKeys.length) {
        throw new Error(`Missing Firebase config keys: ${invalidKeys.join(', ')}`);
    }

    return initializeApp(firebaseConfig);
}

class FirebaseClient {
    private _initialized = false;
    private _firebaseApp: FirebaseApp | null = null;
    private _firebaseFcm: Messaging | null = null;

    init() {
        if (!('serviceWorker' in navigator) || !('Notification' in window)) {
            console.warn('[firebase] Firebase messaging not supported');
            throw new Error('Firebase messaging not supported');
        }
        if (this._initialized) return;

        this._firebaseApp = createFirebaseApp();
        this._firebaseFcm = getMessaging(this._firebaseApp);
        Reflect.set(window, '_firebaseFcm', this._firebaseFcm);
        this.listenMessage();

        this._initialized = true;
        console.log('[firebase] Initialized');
    }

    listenMessage() {
        if (!this._firebaseFcm) return;

        onMessage(this._firebaseFcm, (payload) => {
            console.log('[firebase] Foreground message received');
            if (!payload.notification || document.visibilityState !== 'visible') return;

            const title = payload.notification?.title || SITE_NAME;

            const notification = new Notification(title, {
                ...payload.notification,
                icon: '/android-chrome-144x144.png',
                data: { url: payload.data?.link },
            });
            notification.onclick = (event) => {
                event.preventDefault();
                const notification = event.currentTarget as Notification;
                const link = parseUrl(notification?.data?.url || payload.data?.link || '');
                if (!link || link.pathname === location.pathname) {
                    window.focus();
                    return;
                }
                window.open(link.href, '_blank');
            };
        });
    }

    reset() {
        if (!this._initialized) return;

        this._initialized = false;
    }

    get firebaseApp() {
        if (!this._initialized || !this._firebaseApp) {
            throw new Error('FirebaseClient not initialized');
        }
        return this._firebaseApp;
    }

    get firebaseFcm() {
        if (!this._initialized || !this._firebaseFcm) {
            throw new Error('FirebaseClient not initialized');
        }
        return this._firebaseFcm;
    }

    get initialized() {
        return this._initialized;
    }
}

export const firebaseClient = new FirebaseClient();
