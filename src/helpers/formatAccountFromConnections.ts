import { safeUnreachable } from '@firefly/utils';

import { Source, SourceInURL } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { ThirdPartySession } from '@/providers/third-party/Session.js';
import type { Account } from '@/providers/types/Account.js';
import type { AllConnections } from '@/providers/types/Firefly.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export function formatAccountFromConnections(
    platform: SourceInURL.Google | SourceInURL.Telegram | SourceInURL.Apple | SourceInURL.Email,
    allConnections?: AllConnections,
): Account | undefined {
    if (!allConnections) return;

    const session = getSessionFromStorage(SessionType.Apple);
    const now = Date.now();
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
                session: session ?? new ThirdPartySession(SessionType.Apple, connection.id, '', now, now),
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
                session: session ?? new ThirdPartySession(SessionType.Telegram, connection.id, '', now, now),
            } satisfies Account;
        }
        case SourceInURL.Email: {
            const connection = allConnections.email?.connected?.[0];

            if (!connection) return;
            return {
                profile: {
                    ...createDummyProfile(Source.Farcaster, Source.Email),
                    profileId: connection.id,
                    displayName: connection.email,
                    handle: connection.email,
                    fullHandle: connection.email,
                },
                session: session ?? new ThirdPartySession(SessionType.Email, connection.id, '', now, now),
            } satisfies Account;
        }
        default:
            safeUnreachable(platform);
            return;
    }
}
