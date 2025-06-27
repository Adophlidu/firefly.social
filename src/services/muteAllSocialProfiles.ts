import { fetchAccountsBulk } from '@lens-protocol/client/actions';

import { Source, SourceInURL } from '@/constants/enum.js';
import { ensureLensResult } from '@/helpers/ensureLensResult.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { resolveSourceInUrlForApi } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { BskySocialMediaProvider } from '@/providers/bsky/SocialMedia.js';
import { FarcasterSocialMediaProvider } from '@/providers/farcaster/SocialMedia.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import { TwitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';

export async function muteAllSocialProfiles(identity: FireflyIdentity) {
    const twitterProfile = getCurrentProfile(Source.Twitter);
    const lensProfile = getCurrentProfile(Source.Lens);
    const bskyProfile = getCurrentProfile(Source.Bsky);

    const results = [{ snsId: identity.id, snsPlatform: resolveSourceInUrlForApi(identity.source) }];
    if (!twitterProfile && !lensProfile && !bskyProfile) return results;

    const socialProfiles = await FireflyEndpointProvider.getAllPlatformProfileByIdentity(identity, false);

    if (twitterProfile) {
        const twitterProfiles = socialProfiles.filter((profile) => profile.identity.source === Source.Twitter);
        await runInSafeAsync(() =>
            Promise.allSettled(
                twitterProfiles.map((profile) => TwitterSocialMediaProxy.blockProfile(profile.identity.id)),
            ),
        );
        results.push(
            ...twitterProfiles.map((profile) => ({
                snsId: profile.identity.id,
                snsPlatform: SourceInURL.Twitter,
            })),
        );
    }

    if (lensProfile) {
        const lensNames = socialProfiles
            .filter((profile) => profile.identity.source === Source.Lens)
            .map((profile) => profile.identity.id);
        if (!lensNames.length) return results;
        await runInSafeAsync(async () => {
            const lensAccounts = await ensureLensResult(
                fetchAccountsBulk(lensSessionHolder.sessionClient, {
                    usernames: lensNames.map((name) => ({ localName: name })),
                }),
            );
            const unmutedAccounts = lensAccounts.filter((account) => !account.operations?.isMutedByMe);
            await Promise.allSettled(
                unmutedAccounts.map((account) => LensSocialMediaProvider.blockProfile(account.address)),
            );
            results.push(
                ...unmutedAccounts.map((account) => ({
                    snsId: account.address,
                    snsPlatform: SourceInURL.Lens,
                })),
            );
        });
    }

    if (bskyProfile) {
        const bskyProfiles = socialProfiles.filter((profile) => profile.identity.source === Source.Bsky);
        await runInSafeAsync(() =>
            Promise.allSettled(
                bskyProfiles.map((profile) => BskySocialMediaProvider.blockProfile(profile.identity.id)),
            ),
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
        await runInSafeAsync(() =>
            Promise.allSettled(
                farcasterProfiles.map((profile) => FarcasterSocialMediaProvider.blockProfile(profile.identity.id)),
            ),
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
        await runInSafeAsync(() =>
            Promise.allSettled(wallets.map((profile) => FireflyEndpointProvider.blockWallet(profile.identity.id))),
        );
        results.push(
            ...wallets.map((profile) => ({
                snsId: profile.identity.id,
                snsPlatform: SourceInURL.Wallet,
            })),
        );
    }

    return results;
}
