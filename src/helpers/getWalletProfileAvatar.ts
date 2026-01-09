import { type FireflyDisplayInfo } from '@/providers/types/Firefly.js';

export function getWalletProfileAvatar(displayInfo: FireflyDisplayInfo | undefined) {
    if (!displayInfo) return undefined;
    if (displayInfo.ensHandle && displayInfo.avatarUrl) return displayInfo.avatarUrl;

    return displayInfo.fireflyAvatarUrl || displayInfo.avatarUrl;
}
