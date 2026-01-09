'use client';

import { Trans } from '@lingui/react/macro';

import { Source } from '@/constants/enum.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload } from '@/providers/twitter/SessionPayload.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

export async function addTwitterAccount(sessionPayload: SessionPayload, isNew = false, signal?: AbortSignal) {
    const profile = sessionPayload ? await twitterSocialMediaProxy.getProfileById(sessionPayload.clientId) : null;
    if (!profile) throw new Error('Failed to fetch user profile');

    // hotfix for the missing verified badge
    await runInSafeAsync(async () => {
        if (profile.verified) return;

        const badges = await twitterSocialMediaProxy.getProfileBadges(profile);
        if (badges.length > 0) profile.verified = true;
    });

    const session = TwitterSession.from(profile.profileId, sessionPayload);

    const fireflySession = isNew ? await bindOrRestoreFireflySession(session) : undefined;

    await addAccount(
        {
            profile,
            session,
            fireflySession,
        },
        {
            skipBelongsToCheck: !isNew,
            skipResumeFireflyAccounts: !isNew,
            skipResumeFireflySession: !isNew,
            skipSyncAccounts: !isNew,
            signal,
        },
    );

    if (isNew) {
        enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Twitter)} account is now connected.</Trans>);
    }
}
