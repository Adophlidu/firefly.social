import type { ActivitiesPlatform, SocialSource } from '@/constants/enum.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function capturePostPlatformFilterTabEvent(pageSource: 'home', source?: SocialSource) {
    return TelemetryProvider.captureEventInSafe(EventId.POSTS_FILTER_CHANGE, {
        social_selected: source ? resolveSourceName(source) : 'all',
        page_source: pageSource,
    });
}

export function captureChainFilterTabEvent(pageSource: 'home' | 'profile', chainId?: string, chainName?: string) {
    return TelemetryProvider.captureEventInSafe(EventId.CHAIN_FILTER_CHANGE, {
        chain_id: chainId || 'all',
        chain_name: chainName || 'all',
        page_source: pageSource,
    });
}

export function captureArticlePlatformFilterTabEvent(pageSource: 'home' | 'profile', platform?: ActivitiesPlatform) {
    return TelemetryProvider.captureEventInSafe(EventId.ACTIVITIES_FILTER_CHANGE, {
        platform_selected: platform || 'all',
        page_source: pageSource,
    });
}
