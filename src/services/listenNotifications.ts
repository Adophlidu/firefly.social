import { NotificationSourceType, type ProfileSource, Source } from '@/constants/enum.js';
import type { Pageable, PageIndicator } from '@/helpers/pageable.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { type Notification as NotificationObject } from '@/providers/types/SocialMedia.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';
import { useBskyProfileStore } from '@/store/useProfileStore/useBskyProfileStore.js';
import { useFarcasterProfileStore } from '@/store/useProfileStore/useFarcasterProfileStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';
import { useLensProfileStore } from '@/store/useProfileStore/useLensProfileStore.js';

interface Config {
    type: NotificationSourceType;
    timeout?: number;
    loginSource: ProfileSource;
    getNotifications: () => Promise<Pageable<NotificationObject, PageIndicator>>;
}

const sourceConfig: Config[] = [
    {
        type: NotificationSourceType.Tips,
        loginSource: Source.Firefly,
        getNotifications: () => FireflyEndpointProvider.getTipsNotifications(),
    },
    {
        timeout: 1000 * 60 * 2,
        type: NotificationSourceType.Schedule,
        loginSource: Source.Firefly,
        getNotifications: () => FireflyEndpointProvider.getScheduleNotifications(),
    },
    {
        type: NotificationSourceType.Farcaster,
        loginSource: Source.Farcaster,
        getNotifications: () => FarcasterSocialMediaProvider.getNotifications(),
    },
    {
        timeout: 1000 * 60 * 2,
        type: NotificationSourceType.Lens,
        loginSource: Source.Lens,
        getNotifications: () => LensSocialMediaProvider.getNotifications(),
    },
    {
        timeout: 1000 * 60 * 2,
        type: NotificationSourceType.Bsky,
        loginSource: Source.Bsky,
        getNotifications: () => BskySocialMediaProvider.getNotifications(),
    },
];
const jobIds = new Set<NodeJS.Timeout>();
let stopped = false;
let running = false;
let activated = false;
let delayJobId: NodeJS.Timeout | null = null;

function getCurrentProfileId(source: Config['loginSource']) {
    switch (source) {
        case Source.Firefly:
            return useFireflyProfileStore.getState().currentProfileSession?.profileId;
        case Source.Farcaster:
            return useFarcasterProfileStore.getState().currentProfile?.profileId;
        case Source.Lens:
            return useLensProfileStore.getState().currentProfile?.profileId;
        case Source.Bsky:
            return useBskyProfileStore.getState().currentProfile?.profileId;
        case Source.Twitter:
        case Source.Telegram:
        case Source.Google:
        case Source.Apple:
        case Source.Email:
            return null;
        default:
            safeUnreachable(source);
            return null;
    }
}

async function scheduleListen(config: Config, jobId?: NodeJS.Timeout) {
    if (jobId) {
        jobIds.delete(jobId);
    }

    const currentProfileId = getCurrentProfileId(config.loginSource);
    if (!currentProfileId) return;

    const notifications = await runInSafeAsync(() => config.getNotifications());
    if (notifications?.data?.length) {
        const lastSeenRecords =
            usePreferencesState.getState().preferences.NOTIFICATION_READ_RECORD?.[config.type] || [];
        const lastSeenId = lastSeenRecords.find(
            (record) => record.profileId === currentProfileId,
        )?.latestNotificationId;
        const latestId = notifications.data[0].notificationId;
        const hasNewNotification = !!lastSeenId && lastSeenId !== latestId;

        // update last seen record
        activated = true;
        usePreferencesState.getState().setPreference('NOTIFICATION_READ_RECORD', (prev) => {
            const updatedRecords = (
                prev[config.type]?.filter((record) => record.profileId !== currentProfileId) || []
            ).map((record) => ({
                ...record,
                isActive: false, // Mark as inactive
            }));
            updatedRecords.push({
                profileId: `${currentProfileId}`,
                latestNotificationId: latestId,
                hasNewNotification,
                isActive: true, // Assuming the notification is active when fetched
            });
            return {
                ...prev,
                [config.type]: updatedRecords,
            };
        });

        if (hasNewNotification || stopped) {
            stopListenNotifications();
            return;
        }
    }

    const newJobId = setTimeout(
        () => {
            scheduleListen(config, newJobId);
        },
        config.timeout || 1000 * 60,
    ); // Reschedule every minute
    jobIds.add(newJobId);
}

async function runListeners() {
    if (running) return;

    running = true;
    stopped = false;

    sourceConfig.forEach((config) => {
        scheduleListen(config).catch((error) => {
            console.error(`Error listening to notifications for ${config.type}:`, error);
        });
    });
    delayJobId = null;
}

export async function listenNotifications(delayMs = 0) {
    if (delayJobId) return;

    if (delayMs > 0) {
        delayJobId = setTimeout(runListeners, delayMs);
        return;
    }

    runListeners();
}

export function stopListenNotifications() {
    running = false;
    stopped = true;

    const currentIds = [...jobIds.values()];
    jobIds.clear();
    currentIds.forEach((jobId) => clearTimeout(jobId));

    if (delayJobId) {
        clearTimeout(delayJobId);
        delayJobId = null;
    }
}

export function getIsActivated() {
    return activated;
}
