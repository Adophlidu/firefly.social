'use client';

import { Trans } from '@lingui/react/macro';

import { Source } from '@/constants/enum.js';
import { FireflySessionRequiredError } from '@/constants/error.js';
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

    // For returning users (isNew=false), handle case where there's no active Firefly session
    // This can happen when user's session expired but they're re-logging in via OAuth
    const fireflySession = isNew ? await bindOrRestoreFireflySession(session, signal) : undefined;

    // If Firefly session creation failed for returning user, don't add account in broken state
    // This prevents dangling accounts that appear connected but don't have Firefly bindings
    if (!isNew && !fireflySession) {
        throw new FireflySessionRequiredError(Source.Twitter);
    }

    await addAccount(
        {
            profile,
            session,
            fireflySession,
        },
        {
            skipBelongsToCheck: !isNew,
            skipResumeFireflyAccounts: !isNew,
            skipResumeFireflySession: !isNew || !fireflySession,
            skipSyncAccounts: !isNew,
            signal,
        },
    );

    if (isNew) {
        enqueueSuccessMessage(<Trans>Your {resolveSourceName(Source.Twitter)} account is now connected.</Trans>);
    }
}
