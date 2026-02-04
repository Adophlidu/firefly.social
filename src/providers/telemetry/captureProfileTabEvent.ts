import { createLookupTableResolver, UnreachableError } from '@dimensiondev/utils';

import { type ProfilePageSource, type SocialSource, Source } from '@/constants/enum.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getProfileEventParameters } from '@/providers/telemetry/getProfileEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { EventId } from '@/providers/types/Telemetry.js';

export type ProfileTabType = 'Feed' | 'Replies' | 'Media' | 'Collected' | 'Cast' | 'Likes' | 'Channels';

type ProfileTabEventIds = Partial<Record<ProfileTabType, EventId>>;

const resolveProfileTabEventId = createLookupTableResolver<SocialSource, ProfileTabEventIds>(
    {
        [Source.Twitter]: {
            Feed: EventId.PROFILE_X_TAB_CLICK,
            Replies: EventId.PROFILE_X_TAB_CLICK,
            Media: EventId.PROFILE_X_TAB_CLICK,
        },
        [Source.Lens]: {
            Feed: EventId.PROFILE_LENS_TAB_CLICK,
            Replies: EventId.PROFILE_LENS_TAB_CLICK,
            Media: EventId.PROFILE_LENS_TAB_CLICK,
            Collected: EventId.PROFILE_LENS_TAB_CLICK,
        },
        [Source.Farcaster]: {
            Cast: EventId.PROFILE_FARCASTER_TAB_CLICK,
            Replies: EventId.PROFILE_FARCASTER_TAB_CLICK,
            Likes: EventId.PROFILE_FARCASTER_TAB_CLICK,
            Channels: EventId.PROFILE_FARCASTER_TAB_CLICK,
        },
        [Source.Bsky]: {
            Feed: EventId.PROFILE_BSKY_TAB_CLICK,
            Replies: EventId.PROFILE_BSKY_TAB_CLICK,
            Likes: EventId.PROFILE_BSKY_TAB_CLICK,
            Media: EventId.PROFILE_BSKY_TAB_CLICK,
        },
    },
    (source) => {
        throw new UnreachableError('source', source);
    },
);

export function captureProfileTabClick(profile: Profile, tab: ProfileTabType) {
    return runInSafeAsync(async () => {
        const eventIdMap = resolveProfileTabEventId(profile.source);
        const eventId = eventIdMap[tab];
        if (!eventId) return;

        return TelemetryProvider.captureEvent(eventId, {
            ...getProfileEventParameters(profile),
            tab,
        } as never);
    });
}

// Simplified version for use with basic parameters
export function captureProfileTabClickSimple(
    source: ProfilePageSource,
    profileId: string,
    handle: string,
    tab: ProfileTabType,
) {
    return runInSafeAsync(async () => {
        // Handle wallet tabs separately
        if (source === Source.Wallet || source === Source.WalletMix) {
            // For wallet, we track Activities tab (Transactions already has existing tracking)
            if (tab === 'Feed') {
                // Activities tab is labeled as "Feed" in the tabTitles
                return TelemetryProvider.captureEvent(EventId.PROFILE_WALLET_ACTIVITIES_TAB_CLICK, {} as never);
            }
            return;
        }

        // Handle social profile tabs
        const eventIdMap: Record<SocialSource, ProfileTabEventIds> = {
            [Source.Twitter]: {
                Feed: EventId.PROFILE_X_TAB_CLICK,
                Replies: EventId.PROFILE_X_TAB_CLICK,
                Media: EventId.PROFILE_X_TAB_CLICK,
            },
            [Source.Lens]: {
                Feed: EventId.PROFILE_LENS_TAB_CLICK,
                Replies: EventId.PROFILE_LENS_TAB_CLICK,
                Media: EventId.PROFILE_LENS_TAB_CLICK,
                Collected: EventId.PROFILE_LENS_TAB_CLICK,
            },
            [Source.Farcaster]: {
                Cast: EventId.PROFILE_FARCASTER_TAB_CLICK,
                Replies: EventId.PROFILE_FARCASTER_TAB_CLICK,
                Likes: EventId.PROFILE_FARCASTER_TAB_CLICK,
                Channels: EventId.PROFILE_FARCASTER_TAB_CLICK,
            },
            [Source.Bsky]: {
                Feed: EventId.PROFILE_BSKY_TAB_CLICK,
                Replies: EventId.PROFILE_BSKY_TAB_CLICK,
                Likes: EventId.PROFILE_BSKY_TAB_CLICK,
                Media: EventId.PROFILE_BSKY_TAB_CLICK,
            },
        };

        const socialSource = source as SocialSource;
        const eventId = eventIdMap[socialSource]?.[tab];
        if (!eventId) return;

        const paramsMap: Record<
            SocialSource,
            (profileId: string, handle: string, tab: ProfileTabType) => Record<string, unknown>
        > = {
            [Source.Twitter]: (id, h, t) => ({ x_id: id, x_handle: h, tab: t }),
            [Source.Lens]: (id, h, t) => ({ lens_id: id, lens_handle: h, tab: t }),
            [Source.Farcaster]: (id, h, t) => ({ farcaster_id: id, farcaster_handle: h, tab: t }),
            [Source.Bsky]: (id, h, t) => ({ bsky_id: id, bsky_handle: h, tab: t }),
        };

        return TelemetryProvider.captureEvent(eventId, paramsMap[socialSource](profileId, handle, tab) as never);
    });
}
