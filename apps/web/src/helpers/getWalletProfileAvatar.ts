import type { FireflyDisplayInfo } from '@/providers/types/Firefly.js';

export function getWalletProfileAvatar(displayInfo?: FireflyDisplayInfo) {
    if (!displayInfo) return;
    if (displayInfo.ensHandle && displayInfo.avatarUrl) return displayInfo.avatarUrl;

    return (displayInfo.fireflyAvatarUrl || displayInfo.avatarUrl) ?? undefined;
}
