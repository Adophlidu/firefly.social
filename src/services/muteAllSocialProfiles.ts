import { fetchAccountsBulk } from '@lens-protocol/client/actions';

import { Source, SourceInURL } from '@/constants/enum.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { bskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { farcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { getAllPlatformProfileByIdentity } from '@/providers/firefly/endpoint/getAllPlatformProfileByIdentity.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';
import { lensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export async function muteAllSocialProfiles(identity: FireflyIdentity) {
    const twitterSession = getSessionFromStorage(SessionType.Twitter);
    const lensSession = getSessionFromStorage(SessionType.Lens);
    const bskySession = getSessionFromStorage(SessionType.Bsky);

    const results = [{ snsId: identity.id, snsPlatform: resolveSourceInUrlForApi(identity.source) }];
    if (!twitterSession && !lensSession && !bskySession) return results;

    const socialProfiles = await getAllPlatformProfileByIdentity(identity, false);

    if (twitterSession) {
        const twitterProfiles = socialProfiles.filter((profile) => profile.identity.source === Source.Twitter);
        await Promise.allSettled(
            twitterProfiles.map((profile) => twitterSocialMediaProxy.blockProfile(profile.identity.id)),
        );
        results.push(
            ...twitterProfiles.map((profile) => ({
                snsId: profile.identity.id,
                snsPlatform: SourceInURL.Twitter,
            })),
        );
    }

    if (lensSession) {
        const lensNames = socialProfiles
            .filter((profile) => profile.identity.source === Source.Lens)
            .map((profile) => profile.identity.id);
        if (!lensNames.length) return results;
        await runInSafeAsync(async () => {
            const lensAccounts = await ensureLensResult(
                fetchAccountsBulk(lensSessionClientHolder.sessionClient, {
                    usernames: lensNames.map((name) => ({ localName: name })),
                }),
            );
            const unmutedAccounts = lensAccounts.filter((account) => !account.operations?.isMutedByMe);
            await Promise.allSettled(
                unmutedAccounts.map((account) => lensSocialMediaProvider.blockProfile(account.address)),
            );
            results.push(
                ...unmutedAccounts.map((account) => ({
                    snsId: account.address,
                    snsPlatform: SourceInURL.Lens,
                })),
            );
        });
    }

    if (bskySession) {
        const bskyProfiles = socialProfiles.filter((profile) => profile.identity.source === Source.Bsky);
        await Promise.allSettled(
            bskyProfiles.map((profile) => bskySocialMediaProvider.blockProfile(profile.identity.id)),
        );
        results.push(
            ...bskyProfiles.map((profile) => ({
                snsId: profile.identity.id,
                snsPlatform: SourceInURL.Bsky,
            })),
        );
    }

    const farcasterProfiles = socialProfiles.filter((profile) => profile.identity.source === Source.Farcaster);
    if (farcasterProfiles.length) {
        await Promise.allSettled(
            farcasterProfiles.map((profile) => farcasterSocialMediaProvider.blockProfile(profile.identity.id)),
        );
        results.push(
            ...farcasterProfiles.map((profile) => ({
                snsId: profile.identity.id,
                snsPlatform: SourceInURL.Farcaster,
            })),
        );
    }

    const wallets = socialProfiles.filter((profile) => profile.identity.source === Source.Wallet);
    if (wallets.length) {
        await Promise.allSettled(wallets.map((profile) => fireflyWalletProvider.blockWallet(profile.identity.id)));
        results.push(
            ...wallets.map((profile) => ({
                snsId: profile.identity.id,
                snsPlatform: SourceInURL.Wallet,
            })),
        );
    }

    return results;
}
