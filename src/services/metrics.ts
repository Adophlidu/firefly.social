import { NobleEd25519Signer } from '@farcaster/core';
import { safeUnreachable } from '@masknet/kit';
import webCrypto from 'crypto';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';
import { toBytes } from 'viem';

import { Source, SourceInURL } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SEVEN_DAYS } from '@/constants/index.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getPublicKeyInHexFromSigner } from '@/helpers/ed25519.js';
import { getAllAccounts } from '@/helpers/getAllProfiles.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveTwitterResponseData } from '@/helpers/resolveTwitterResponseData.js';
import { verifyPasscodeOnServer } from '@/modals/PasswordModal/runPasswordWorkflow.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { FarcasterSession } from '@/providers/farcaster/Session.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { twitterSessionHolder } from '@/providers/twitter/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import type {
    BskyMetricsData,
    CommonMetricsData,
    FarcasterMetricsData,
    LensMetricsData,
    MetricsItemToUpload,
    MetricsMetaInfo,
    TwitterMetricsData,
} from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { encryptMetricsData } from '@/services/encryptMetricsData.js';
import type { ResponseJSON } from '@/types/index.js';

function sha256(message: string) {
    return webCrypto.createHash('sha256').update(message, 'utf8').digest('hex');
}

function encryptCipherText(passcode: string, text: string) {
    const key = sha256(passcode);
    const encryptData = encryptMetricsData(text, key, env.external.NEXT_PUBLIC_PASSCODE_IV);
    return encryptData;
}

function decryptCipherText(passcode: string, text: string) {
    const key = sha256(passcode);
    const decipher = webCrypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(key, 'hex'),
        Buffer.from(env.external.NEXT_PUBLIC_PASSCODE_IV, 'hex'),
    );
    let decrypted = decipher.update(text, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

async function getMetricsDataToUpload(account: Account, passcode: string) {
    const platform = (
        account.profile.source === Source.Bsky ? 'bluesky' : resolveSocialSourceInUrl(account.profile.source)
    ) as MetricsMetaInfo['platform'];
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
                identity_token: session.token,
                address: account.profile.profileId,
            } satisfies LensMetricsData;
        }
        case Source.Bsky: {
            const session = account.session as BskySession;

            return {
                ...commonData,
                access_jwt: session.sessionPayload.accessJwt,
                refresh_jwt: session.sessionPayload.refreshJwt,
                did: session.sessionPayload.did,
                server_host: session.serviceUrl,
                handle: account.profile.handle,
            } satisfies BskyMetricsData;
        }
        case Source.Farcaster: {
            const session = account.session as FarcasterSession;
            const signer = new NobleEd25519Signer(toBytes(session.token));
            const publicKey = await getPublicKeyInHexFromSigner(signer);
            if (!publicKey) return null;

            return {
                ...commonData,
                fid: Number.parseInt(account.profile.profileId, 10),
                signer_private_key: session.token,
                signer_public_key: publicKey,
            } satisfies FarcasterMetricsData;
        }
        case Source.Twitter: {
            const twitterSession = await twitterSessionHolder.fetch<ResponseJSON<string>>(
                urlcat('/api/twitter/encrypt-session', {
                    profileId: account.profile.profileId,
                    encryptKey: sha256(passcode),
                }),
            );
            return resolveTwitterResponseData(twitterSession);
        }
        default:
            safeUnreachable(account.profile.source);
            return null;
    }
}

async function getLocalMetrics(passcode: string) {
    const allAccounts = getAllAccounts();

    return await Promise.all(
        allAccounts.map(async (account) => {
            const platform = (
                account.profile.source === Source.Bsky ? 'bluesky' : resolveSocialSourceInUrl(account.profile.source)
            ) as MetricsMetaInfo['platform'];
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
        }),
    );
}

export async function uploadMetrics(passcode: string) {
    const localMetrics = await getLocalMetrics(passcode);

    const validMetrics = compact(localMetrics);
    if (!validMetrics.length) {
        throw new Error('No valid metrics data to upload.');
    }

    return await FireflyEndpointProvider.uploadMetrics(passcode, validMetrics);
}

export async function downloadAccounts() {
    const response = await FireflyEndpointProvider.downloadMetaInfo();

    return response.metrics.map(({ metaInfo }) => {
        const sourceInUrl = metaInfo.platform === 'bluesky' ? SourceInURL.Bsky : metaInfo.platform;
        const source = resolveSocialSource(sourceInUrl);

        return {
            ...createDummyProfile(source),
            profileId: metaInfo.profileId,
            handle: metaInfo.profileHandle,
            displayName: metaInfo.name,
            pfp: metaInfo.avatar,
        } satisfies Profile;
    });
}

/**
 * merge local metrics with remote metrics
 * @param passcode
 */
export async function mergeMetrics(passcode: string) {
    if (!(await verifyPasscodeOnServer(passcode))) return false;

    const localMetrics = await getLocalMetrics(passcode);

    const validLocalMetrics = compact(localMetrics);
    if (!validLocalMetrics.length) {
        throw new Error('No valid local metrics data.');
    }
    const remoteMetricsResponse = await FireflyEndpointProvider.downloadMetrics(passcode);
    const remoteMetrics = remoteMetricsResponse.metrics.map(({ identity, ...metric }) => metric);

    // merge local metrics with remote metrics, if local metrics is not in remote metrics, add it to remote metrics
    const mergedMetrics = [...remoteMetrics];
    for (const localMetric of validLocalMetrics) {
        const { platform, profileId } = localMetric.metaInfo;
        const index = remoteMetrics.findIndex(
            (metric) => metric.metaInfo.platform === platform && metric.metaInfo.profileId === profileId,
        );

        if (index !== -1) {
            mergedMetrics[index] = localMetric;
        } else {
            mergedMetrics.push(localMetric);
        }
    }

    await FireflyEndpointProvider.uploadMetrics(passcode, compact(mergedMetrics));

    for (const info of remoteMetrics) {
        const { platform, loginTime } = info.metaInfo;

        if (platform === 'bluesky' || platform === 'x') {
            const isLatest = remoteMetrics.every(
                (metric) =>
                    metric.metaInfo.platform !== platform ||
                    metric.metaInfo.profileId !== info.metaInfo.profileId ||
                    Number(metric.metaInfo.loginTime) <= Number(loginTime),
            );
            if (!isLatest) continue;
        }

        const { ciphertext, metaInfo } = info;
        const { profileId, profileHandle, name, avatar } = metaInfo;
        const sourceInUrl = platform === 'bluesky' ? SourceInURL.Bsky : platform;
        const source = resolveSocialSource(sourceInUrl);
        if (!source) continue;
        const currentProfile = getCurrentProfile(source);

        const decryptedData = JSON.parse(decryptCipherText(passcode, ciphertext)) as CommonMetricsData;
        const now = Date.now();
        const profileState = getProfileState(source);

        const profile = {
            ...createDummyProfile(source),
            profileId,
            handle: profileHandle,
            displayName: name,
            pfp: avatar,
        } satisfies Profile;

        switch (source) {
            case Source.Lens: {
                const data = decryptedData as LensMetricsData;
                const session = new LensSession(
                    profileId,
                    data.token,
                    now,
                    now + SEVEN_DAYS,
                    data.refresh_token,
                    data.address,
                );

                const account = {
                    profile,
                    session,
                } satisfies Account;

                if (!currentProfile) {
                    await lensSessionHolder.resumeSession(session, true);
                }

                profileState.addAccount(account, !currentProfile);

                break;
            }

            case Source.Farcaster: {
                const data = decryptedData as FarcasterMetricsData;
                const session = new FarcasterSession(profileId, data.signer_private_key, now, now);
                const account = {
                    profile,
                    session,
                };
                if (!currentProfile) {
                    farcasterSessionHolder.resumeSession(session);
                }

                profileState.addAccount(account, !currentProfile);

                break;
            }
            case Source.Twitter: {
                if (currentProfile) break;
                const data = decryptedData as TwitterMetricsData;
                const session = new TwitterSession(profileId, data.access_token, now, now, {
                    clientId: data.client_id,
                    accessToken: data.access_token,
                    accessTokenSecret: data.access_token_secret,
                    consumerKey: data.consumer_key,
                    consumerSecret: data.consumer_secret,
                });
                profileState.addAccount(
                    {
                        profile,
                        session,
                    },
                    true,
                );
                break;
            }
            case Source.Bsky: {
                if (currentProfile) break;
                const data = decryptedData as BskyMetricsData;
                const session = new BskySession(profileId, now, now, data.server_host, {
                    did: data.did,
                    handle: data.handle,
                    accessJwt: data.access_jwt,
                    refreshJwt: data.refresh_jwt,
                    active: true,
                });
                profileState.addAccount(
                    {
                        profile,
                        session,
                    },
                    true,
                );
                break;
            }
            default:
                safeUnreachable(source);
        }
    }

    return true;
}
