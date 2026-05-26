import type { ProfilePageSource } from '@dimensiondev/enums';
import { SourceInURL } from '@dimensiondev/enums';

import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';

function normalizeLensCampPlatformId(platformId: string) {
    try {
        return safeEvmAddress(platformId).toLowerCase();
    } catch {
        return platformId.toLowerCase();
    }
}

/** Align with Mask-X-Backend fifa_activity.service normalizeCampCheckPlatformId */
export function normalizeFifaCampPlatformId(source: ProfilePageSource, platformId: string) {
    const platform = resolveSourceInUrlForApi(source);
    if (platform === SourceInURL.Lens) {
        return normalizeLensCampPlatformId(platformId);
    }
    return platformId;
}

/** Response rows use `platform` string from API (e.g. `"lens"`). */
export function normalizeFifaCampPlatformIdFromApiPlatform(platform: string, platformId: string) {
    if (platform === SourceInURL.Lens || platform === 'lens') {
        return normalizeLensCampPlatformId(platformId);
    }
    return platformId;
}

export function fifaCampCheckMapKey(source: ProfilePageSource, platformId: string) {
    return `${resolveSourceInUrlForApi(source)}:${normalizeFifaCampPlatformId(source, platformId)}`;
}

export function fifaCampCheckMapKeyFromApiRow(platform: string, platformId: string) {
    return `${platform}:${normalizeFifaCampPlatformIdFromApiPlatform(platform, platformId)}`;
}
