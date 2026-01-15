'use client';

import { t } from '@lingui/core/macro';
import { compact } from 'lodash-es';

import { decryptAppScanLoginEncryptedData } from '@/actions/decryptAppScanLoginEncryptedData.js';
import { queryClient } from '@/configs/queryClient.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { DecryptionError } from '@/constants/error.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSessionHolderFromProfileSource } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromSessionType } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { SessionFactory } from '@/providers/base/SessionFactory.js';
import { type BskySession } from '@/providers/bsky/Session.js';
import { type FarcasterSession } from '@/providers/farcaster/Session.js';
import { type FireflySession } from '@/providers/firefly/Session.js';
import { type LensSession } from '@/providers/lens/Session.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import { type TwitterSession } from '@/providers/twitter/Session.js';
import { type Account } from '@/providers/types/Account.js';
import { DesktopLinkInfoStatus, type DesktopLinkInfoStatusData } from '@/providers/types/Firefly.js';
import { SessionType } from '@/providers/types/SocialMedia.js';
import { addAccounts } from '@/services/account.js';
import { ensureSessionIsValid } from '@/services/ensureSessionIsValid.js';
import { restoreFarcasterAccountsIfNeeded } from '@/services/restoreFarcasterAccounts.js';

type SocialSession = FarcasterSession | LensSession | TwitterSession | BskySession;

export async function loginWithAppScan(data: DesktopLinkInfoStatusData, otp: string) {
    if (data.status !== DesktopLinkInfoStatus.Confirm) throw new DecryptionError(t`The encrypted data not found.`);
    if (!data.encryptedData) throw new DecryptionError(t`The encrypted data not found.`);

    const response = await decryptAppScanLoginEncryptedData(data.encryptedData, otp);
    if ('error' in response) throw new DecryptionError(response.error);

    const fireflySession = SessionFactory.createSession<FireflySession>(response.fireflySession);
    const sessions = response.sessions.map((session) => SessionFactory.createSession<SocialSession>(session));
    const settled = await Promise.allSettled(
        sessions.map(async (session) => {
            if (session.type === SessionType.Bsky) return null;
            const newSession = await ensureSessionIsValid(session);
            const source = resolveSourceFromSessionType(session.type) as SocialSource;
            const profile = await resolveSocialMediaProvider(source).getProfileById(session.profileId);
            return {
                origin: 'sync',
                profile,
                fireflySession,
                session: newSession,
            } satisfies Account;
        }),
    );
    const accounts = compact(settled.map((x) => (x.status === 'fulfilled' ? x.value : null)));
    const result = await addAccounts(fireflySession, accounts, {
        async setAsCurrent(account) {
            const sessionHolder = resolveSessionHolderFromProfileSource(account.profile.source);
            await sessionHolder?.resumeSession(account.session);
        },
    });

    if (result) {
        // dispatch restore farcaster accounts if needed
        await restoreFarcasterAccountsIfNeeded(accounts);

        await queryClient.refetchQueries({ queryKey: ['all-profiles'] });
        await queryClient.refetchQueries({ queryKey: ['allConnections'] });

        const lensProfile = getCurrentProfileFromStorage(Source.Lens);
        const currentLensAccount = accounts.find((x) => isSameProfile(x.profile, lensProfile));
        if (currentLensAccount) {
            await runInSafeAsync(() => setPrivyAsLensManager(currentLensAccount));
        }
    }

    return result;
}
