import { safeUnreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';
import { sha256, toHex } from 'viem';

import { Source, SourceInURL } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { getPublicKeyInHexFromPrivateKey } from '@/providers/farcaster/ed25519.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { LensSession } from '@/providers/lens/Session.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import type { Account } from '@/providers/types/Account.js';
import type {
    CommonMetricsData,
    FarcasterMetricsData,
    LensMetricsData,
    MetricsItemToUpload,
    MetricsMetaInfo,
} from '@/providers/types/Firefly.js';
import { encryptAes256 } from '@/services/crypto.js';
import type { ResponseJson } from '@/types/utility.js';

function encryptCipherText(passcode: string, text: string) {
    const key = sha256(toHex(passcode)).replace(/^0x/, '');
    return encryptAes256(text, key, env.external.NEXT_PUBLIC_PASSCODE_IV);
}

async function getMetricsDataToUpload(account: Account, passcode: string) {
    const platform = resolveSocialSourceInUrl(account.profile.source);
    if (platform === SourceInURL.Bsky) return null;

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
        case Source.Twitter: {
            const twitterSession = account.session as TwitterSession;
            const encodedMetricsData = await fetchJson<ResponseJson<string>>(
                urlcat('/api/twitter/encrypt-session', {
                    profileId: account.profile.profileId,
                    encryptKey: sha256(toHex(passcode)).replace(/^0x/, ''),
                }),
                {
                    headers: TwitterSession.payloadToHeaders(twitterSession.payload),
                },
            );
            return resolveTwitterResponseData(encodedMetricsData);
        }
        case Source.Bsky:
            return null;
        default:
            safeUnreachable(account.profile.source);
            return null;
    }
}

export async function getAccountMetricsData(account: Account, passcode: string) {
    if (account.profile.source === Source.Bsky) {
        return null;
    }

    const platform = resolveSocialSourceInUrl(account.profile.source) as MetricsMetaInfo['platform'];
    const metricsData = await getMetricsDataToUpload(account, passcode);
    if (!metricsData) return null;

    const metaInfo: MetricsMetaInfo = {
        platform,
        profileId: account.profile.profileId,
        profileHandle: account.profile.handle,
        name: account.profile.displayName || '',
        avatar: account.profile.pfp || '',
        loginTime: Date.now().toString(),
    };

    return {
        metaInfo,
        ciphertext:
            account.profile.source === Source.Twitter
                ? (metricsData as string) // Twitter metrics data is already encrypted
                : encryptCipherText(passcode, JSON.stringify(metricsData)),
    } satisfies MetricsItemToUpload;
}
