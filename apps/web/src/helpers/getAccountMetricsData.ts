import { Source, SourceInURL } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs';
import { safeUnreachable } from '@dimensiondev/utils';
import { sha256, toHex } from 'viem';

import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { getPublicKeyInHexFromPrivateKey } from '@/providers/farcaster/ed25519.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { TwitterSession } from '@/providers/twitter/Session.js';
import type { Account } from '@/providers/types/Account.js';
import type {
    CommonMetricsData,
    FarcasterMetricsData,
    LensMetricsData,
    MetricsItemToUpload,
    MetricsMetaInfo,
} from '@/providers/types/Firefly.js';
import { encryptAes256 } from '@/services/crypto.js';

function encryptCipherText(passcode: string, text: string) {
    const key = sha256(toHex(passcode)).replace(/^0x/, '');
    return encryptAes256(text, key, envs.external.NEXT_PUBLIC_PASSCODE_IV);
}

async function getMetricsDataToUpload(account: Account) {
    const platform = resolveSocialSourceInUrl(account.profile.source);
    // twitter metrics data will be uploaded in server directly, and bsky metrics data is not supported now
    if (platform === SourceInURL.Bsky || platform === SourceInURL.Twitter) return null;

    const commonData: CommonMetricsData = {
        platform,
        profile_id: account.profile.profileId,
        login_time: Date.now().toString(),
    };

    switch (account.profile.source) {
        case Source.Lens: {
            const session = account.session as LensSession;
            return {
                ...commonData,
                token: session.token,
                refresh_token: session.refreshToken,
                identity_token: session.identityToken,
                address: account.profile.profileId,
            } satisfies LensMetricsData;
        }
        case Source.Farcaster: {
            const session = account.session as FarcasterSession;
            const publicKey = await getPublicKeyInHexFromPrivateKey(session.token);
            if (!publicKey) return null;

            return {
                ...commonData,
                fid: Number.parseInt(account.profile.profileId, 10),
                signer_private_key: session.token,
                signer_public_key: publicKey,
            } satisfies FarcasterMetricsData;
        }
        case Source.Twitter:
        case Source.Bsky:
            return null;
        default:
            safeUnreachable(account.profile.source);
            return null;
    }
}

export async function getAccountMetricsData(account: Account, passcode: string): Promise<MetricsItemToUpload | null> {
    const source = account.profile.source;
    if (source === Source.Bsky) return null;

    const platform = resolveSocialSourceInUrl(source) as MetricsMetaInfo['platform'];
    const metaInfo: MetricsMetaInfo = {
        platform,
        profileId: account.profile.profileId,
        profileHandle: account.profile.handle,
        name: account.profile.displayName || '',
        avatar: account.profile.pfp || '',
        loginTime: Date.now().toString(),
    };
    if (source === Source.Twitter) {
        return {
            source,
            session: account.session as TwitterSession,
            metrics: { metaInfo },
        };
    }

    const metricsData = await getMetricsDataToUpload(account);
    if (!metricsData) return null;

    return {
        source,
        metrics: {
            metaInfo,
            ciphertext: encryptCipherText(passcode, JSON.stringify(metricsData)),
        },
    };
}
