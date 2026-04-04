import { envs } from '@dimensiondev/envs';
import { parseUrl } from '@dimensiondev/utils';
import { type Analytics, getAnalytics, isSupported as isAnalyticsSupported, logEvent } from 'firebase/analytics';
import { type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app';
import {
    getMessaging,
    isSupported as isMessageSupported,
    type Messaging,
    onMessage,
    type Unsubscribe,
} from 'firebase/messaging';

import { SITE_NAME } from '@/constants/static.js';
import { logger } from '@/libs/Logger.js';

function createFirebaseApp() {
    const firebaseConfig: FirebaseOptions = {
        apiKey: envs.external.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: envs.external.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: envs.external.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: envs.external.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: envs.external.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: envs.external.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: envs.external.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
    private _unsubscribe: Unsubscribe | undefined;
    private _analytics: Analytics | null = null;

    async init() {
        const supportMessage = await isMessageSupported();
        if (!supportMessage) {
            logger.warn('[firebase] Firebase messaging not supported');
            throw new Error('Firebase messaging not supported');
        }
        if (this._initialized) return;

        this._firebaseApp = createFirebaseApp();
        this._firebaseFcm = getMessaging(this._firebaseApp);

        const supportAnalytics = await isAnalyticsSupported();
        if (supportAnalytics) {
            this._analytics = getAnalytics(this._firebaseApp);
        }

        Reflect.set(window, '_firebaseFcm', this._firebaseFcm);
        this.listenMessage();

        this._initialized = true;
        logger.info('[firebase] Initialized');
    }

    listenMessage() {
        if (!this._firebaseFcm) return;

        this._unsubscribe = onMessage(this._firebaseFcm, (payload) => {
            logger.info('[firebase] Foreground message received');
            if (this._analytics) {
                logEvent(this._analytics, 'notification_foreground', payload);
            }
            if (!payload.notification || document.visibilityState !== 'visible') return;

            const title = payload.notification?.title || SITE_NAME;

            const notification = new Notification(title, {
                ...payload.notification,
                icon: '/android-chrome-144x144.png',
                data: { link: payload.data?.link },
            });
            notification.onclick = (event) => {
                if (this._analytics) {
                    logEvent(this._analytics, 'notification_foreground_click', payload);
                }
                event.preventDefault();
                const notification = event.currentTarget as Notification;
                const link = parseUrl(notification?.data?.link || payload.data?.link || '');
                if (!link || link.pathname === location.pathname) {
                    window.focus();
                    return;
                }
                notification.close();
                window.open(link.href, '_blank');
            };
        });
    }

    reset() {
        if (!this._initialized) return;

        this._initialized = false;
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = undefined;
        }
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
