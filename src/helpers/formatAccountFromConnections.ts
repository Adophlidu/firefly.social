import { safeUnreachable } from '@masknet/kit';

import { Source, SourceInURL } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { Account } from '@/providers/types/Account.js';
import type { AllConnections } from '@/providers/types/Firefly.js';
import { useThirdPartyStateStore } from '@/store/useProfileStore.js';

export function formatAccountFromConnections(
    platform: SourceInURL.Google | SourceInURL.Telegram | SourceInURL.Apple,
    allConnections?: AllConnections,
): Account | undefined {
    if (!allConnections) return;

    const session = useThirdPartyStateStore.getState().currentProfileSession;
    if (!session) return;

    switch (platform) {
        case SourceInURL.Google:
        case SourceInURL.Apple: {
            const connection = allConnections[platform]?.connected?.[0];
            if (!connection) return;

            return {
                profile: {
                    ...createDummyProfile(
                        Source.Farcaster,
                        platform === SourceInURL.Google ? Source.Google : Source.Apple,
                    ),
                    profileId: connection.id,
                    displayName: connection.email,
                    handle: connection.email,
                    fullHandle: connection.email,
                },
                session,
            } satisfies Account;
        }
        case SourceInURL.Telegram: {
            const connection = allConnections.telegram?.connected?.[0];
            if (!connection) return;

            return {
                profile: {
                    ...createDummyProfile(Source.Farcaster, Source.Telegram),
                    profileId: connection.id,
                    displayName: connection.handle,
                    handle: connection.handle,
                    fullHandle: connection.handle,
                },
                session,
            } satisfies Account;
        }
        default:
            safeUnreachable(platform);
            return;
    }
}
