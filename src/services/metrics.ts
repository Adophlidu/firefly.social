import { NobleEd25519Signer } from '@farcaster/core';
import { safeUnreachable } from '@masknet/kit';
import webCrypto from 'crypto';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';
import { toBytes } from 'viem';

import { type SocialSource, Source } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { getPublicKeyInHexFromSigner } from '@/helpers/ed25519.js';
import { ensureLensResultSync } from '@/helpers/ensureLensResult.js';
import { getCurrentAvailableSources } from '@/helpers/getCurrentAvailableSources.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { resolveTwitterResponseData } from '@/helpers/resolveTwitterResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type {
    BskyMetricsData,
    CommonMetricsData,
    FarcasterMetricsData,
    LensMetricsData,
    MetricsItemToUpload,
    MetricsMetaInfo,
} from '@/providers/types/Firefly.js';
import { useBskyStateStore, useFarcasterStateStore } from '@/store/useProfileStore.js';
import type { ResponseJSON } from '@/types/index.js';

function sha256(message: string) {
    return webCrypto.createHash('sha256').update(message, 'utf8').digest('hex');
}

export function encryptMetricsData(text: string, key: string, iv: string) {
    const cipher = webCrypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

function encryptCipherText(passcode: string, text: string) {
    const key = sha256(passcode);
    const encryptData = encryptMetricsData(text, key, env.external.NEXT_PUBLIC_PASSCODE_IV);
    return encryptData;
}

async function getMetricsDataToUpload(source: SocialSource, passcode: string) {
    const profile = getCurrentProfile(source);
    if (!profile) return null;

    const platform = (
        source === Source.Bsky ? 'bluesky' : resolveSocialSourceInUrl(source)
    ) as MetricsMetaInfo['platform'];
    const commonData: CommonMetricsData = {
        platform,
        profile_id: profile.profileId,
        login_time: Date.now().toString(),
    };

    switch (source) {
        case Source.Lens: {
            const credentials = ensureLensResultSync(lensSessionHolder.sessionClient.getCredentials());
            if (!credentials) return null;

            return {
                ...commonData,
                token: credentials.accessToken,
                refresh_token: credentials.refreshToken,
                identity_token: credentials.idToken,
                address: profile.profileId,
            } satisfies LensMetricsData;
        }
        case Source.Bsky: {
            const session = bskySessionHolder.agent.sessionManager.session;
            const bskySession = useBskyStateStore.getState().currentProfileSession as BskySession | null;
            if (!session || !bskySession) return null;

            return {
                ...commonData,
                access_jwt: session.accessJwt,
                refresh_jwt: session.refreshJwt,
                did: session.did,
                server_host: bskySession.serviceUrl,
                handle: profile.handle,
            } satisfies BskyMetricsData;
        }
        case Source.Farcaster: {
            const farcasterSession = useFarcasterStateStore.getState().currentProfileSession as FarcasterSession | null;
            if (!farcasterSession) return null;

            const signer = new NobleEd25519Signer(toBytes(farcasterSession.token));
            const publicKey = await getPublicKeyInHexFromSigner(signer);
            if (!publicKey) return null;

            return {
                ...commonData,
                fid: Number.parseInt(profile.profileId, 10),
                signer_private_key: farcasterSession.token,
                signer_public_key: publicKey,
            } satisfies FarcasterMetricsData;
        }
        case Source.Twitter: {
            const twitterSession = await twitterSessionHolder.fetch<ResponseJSON<string>>(
                urlcat('/api/twitter/encrypt-session', {
                    profileId: profile.profileId,
                    encryptKey: sha256(passcode),
                }),
            );
            return resolveTwitterResponseData(twitterSession);
        }
        default:
            safeUnreachable(source);
            return null;
    }
}

export async function uploadMetrics(passcode: string, source?: SocialSource) {
    const availableSources = getCurrentAvailableSources();

    if (source && !availableSources.includes(source)) {
        throw new Error(`You haven't logged in to ${resolveSourceName(source)} yet.`);
    }

    const sourcesToUpload = source ? [source] : availableSources;
    const metrics = await Promise.all(
        sourcesToUpload.map(async (sourceToUpload) => {
            const profile = getCurrentProfile(sourceToUpload);
            if (!profile) return null;

            const platform = (
                sourceToUpload === Source.Bsky ? 'bluesky' : resolveSocialSourceInUrl(sourceToUpload)
            ) as MetricsMetaInfo['platform'];
            const metricsData = await getMetricsDataToUpload(sourceToUpload, passcode);
            if (!metricsData) return null;

            const metaInfo: MetricsMetaInfo = {
                platform,
                profileId: profile.profileId,
                profileHandle: profile.handle,
                name: profile.displayName || '',
                avatar: profile.pfp || '',
                loginTime: Date.now().toString(),
            };

            return {
                metaInfo,
                ciphertext:
                    sourceToUpload === Source.Twitter
                        ? (metricsData as string) // Twitter metrics data is already encrypted
                        : encryptCipherText(passcode, JSON.stringify(metricsData)),
            } satisfies MetricsItemToUpload;
        }),
    );

    const validMetrics = compact(metrics);
    if (!validMetrics.length) {
        throw new Error('No valid metrics data to upload.');
    }

    return await FireflyEndpointProvider.uploadMetrics(passcode, validMetrics);
}
