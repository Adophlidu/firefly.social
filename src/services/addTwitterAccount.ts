'use client';

import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { SessionPayload } from '@/providers/twitter/SessionPayload.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
import { addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';

export async function addTwitterAccount(payload: SessionPayload, isNew = false) {
    const profile = payload ? await TwitterSocialMediaProvider.getProfileById(payload.clientId) : null;
    if (!profile) throw new Error('Failed to fetch user profile');

    // hotfix for the missing verified badge
    await runInSafeAsync(async () => {
        if (profile.verified) return;

        const badges = await TwitterSocialMediaProvider.getProfileBadges(profile);
        if (badges.length > 0) profile.verified = true;
    });

    const session = TwitterSession.from(profile.profileId, payload);

    await addAccount(
        {
            profile,
            session,
            fireflySession: isNew ? await bindOrRestoreFireflySession(session) : undefined,
        },
        {
            skipBelongsToCheck: !isNew,
            skipResumeFireflyAccounts: !isNew,
            skipResumeFireflySession: !isNew,
        },
    );
}
