import { FireflyPlatform } from '@/constants/enum.js';
import { type FireflyDisplayInfo, type FireflyDisplayInfoV2 } from '@/providers/types/Firefly.js';

function isLowerEqual(a?: string | null, b?: string | null) {
    if (!a || !b) return false;

    return a.toLowerCase() === b.toLowerCase();
}

export function getEnsNameFromDisplayInfo(
    data: { displayInfo?: FireflyDisplayInfo; displayInfoV2?: FireflyDisplayInfoV2 },
    address: string,
) {
    const { name, platform, id } = data.displayInfoV2 || {};
    if (name && platform === FireflyPlatform.Wallet && isLowerEqual(id, address) && !isLowerEqual(name, id))
        return name;

    return data.displayInfo?.ensHandle || undefined;
}
