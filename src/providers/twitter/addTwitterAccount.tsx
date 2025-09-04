'use client';

import { t } from '@lingui/core/macro';

import { FireflyAlreadyBoundError } from '@/constants/error.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { SessionPayload } from '@/providers/twitter/SessionPayload.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import { addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { Source } from '@/constants/enum.js';
import { Trans } from '@lingui/react/macro';

export async function addTwitterAccount(payload: SessionPayload, isNew = false, signal?: AbortSignal) {
    const profile = payload ? await TwitterSocialMediaProxy.getProfileById(payload.clientId) : null;
    if (!profile) throw new Error('Failed to fetch user profile');

    // hotfix for the missing verified badge
    await runInSafeAsync(async () => {
        if (profile.verified) return;

        const badges = await TwitterSocialMediaProxy.getProfileBadges(profile);
        if (badges.length > 0) profile.verified = true;
    });

    const session = TwitterSession.from(profile.profileId, payload);

    try {
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
    } catch (error) {
        if (error instanceof FireflyAlreadyBoundError) {
            enqueueWarningMessage(
                t`The account you are trying to log in with is already linked to a different Firefly account.`,
            );
            return;
        }

        throw error;
    }
}
