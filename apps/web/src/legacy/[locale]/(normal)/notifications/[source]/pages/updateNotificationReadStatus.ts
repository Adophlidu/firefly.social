import { usePreferencesState } from '@/store/usePreferenceStore.js';

export function updateNotificationReadStatus() {
    const { setPreference } = usePreferencesState.getState();

    setPreference('NOTIFICATION_READ_RECORD', (prev) => {
        const entries = Object.entries(prev || {}).map(([type, records]) => {
            return [
                type,
                Array.isArray(records) ? records.map((record) => ({ ...record, hasNewNotification: false })) : [],
            ];
        });
        return Object.fromEntries(entries);
    });
}
