import { NobleEd25519Signer } from '@farcaster/core';
import { t } from '@lingui/core/macro';
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
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { getAllAccounts } from '@/helpers/getAllProfiles.js';
import { getCurrentProfile } from '@/helpers/getCurrentProfile.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { resolveSessionHolderFromProfileSource } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { resolveTwitterResponseData } from '@/helpers/resolveTwitterResponseData.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { FAKE_SIGNER_REQUEST_TOKEN, FarcasterSession } from '@/providers/farcaster/Session.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { Account } from '@/providers/types/Account.js';
import type {
    BskyMetricsData,
    CommonMetricsData,
    FarcasterMetricsData,
    LensMetricsData,
    MetricsItemToUpload,
    MetricsMetaInfo,
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
            const twitterSession = account.session as TwitterSession;
            const encodedMetricsData = await fetchJSON<ResponseJSON<string>>(
                urlcat('/api/twitter/encrypt-session', {
                    profileId: account.profile.profileId,
                    encryptKey: sha256(passcode),
                }),
                {
                    headers: TwitterSession.payloadToHeaders(twitterSession.payload),
                },
            );
            return resolveTwitterResponseData(encodedMetricsData);
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

    return response.metrics;
}

/**
 * merge local metrics with remote metrics
 * @param passcode
 */
export async function mergeMetrics(passcode: string, enqueueMessage = true) {
    const localMetrics = await getLocalMetrics(passcode);

    const validLocalMetrics = compact(localMetrics);

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
        if (
            validLocalMetrics.some(
                (x) =>
                    x.metaInfo.profileId === info.metaInfo.profileId && x.metaInfo.platform === info.metaInfo.platform,
            )
        ) {
            continue;
        }

        const { platform, loginTime } = info.metaInfo;

        if (platform === 'bluesky' || platform === 'x') {
            const isLatest = remoteMetrics.every((metric) => {
                if (metric.metaInfo.platform !== platform || metric.metaInfo.profileId === info.metaInfo.profileId) {
                    return true;
                }

                return Number(metric.metaInfo.loginTime) <= Number(loginTime);
            });
            if (!isLatest) continue;
        }

        const { ciphertext, metaInfo } = info;
        const { profileId, profileHandle, name, avatar } = metaInfo;
        const sourceInUrl = platform === 'bluesky' ? SourceInURL.Bsky : platform;
        const source = resolveSocialSource(sourceInUrl);
        if (!source) continue;
        const currentProfile = getCurrentProfile(source);

        const decryptedData =
            source !== Source.Twitter
                ? (JSON.parse(decryptCipherText(passcode, ciphertext)) as CommonMetricsData)
                : null;
        const now = Date.now();
        const profileState = getProfileState(source);
        const sessionHolder = resolveSessionHolderFromProfileSource(source);
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
                    origin: 'sync',
                } satisfies Account;

                if (!currentProfile) {
                    await lensSessionHolder.resumeSession(session, true);
                }

                profileState.addAccount(account, !currentProfile);
                captureAccountLoginEvent(account);
                break;
            }

            case Source.Farcaster: {
                const data = decryptedData as FarcasterMetricsData;
                const session = new FarcasterSession(
                    profileId,
                    data.signer_private_key.startsWith('0x') ? data.signer_private_key : `0x${data.signer_private_key}`,
                    now,
                    now,
                    FAKE_SIGNER_REQUEST_TOKEN,
                );
                const account = {
                    profile,
                    session,
                    origin: 'sync',
                } satisfies Account;
                if (!currentProfile) {
                    sessionHolder.resumeSession(session);
                }
                captureAccountLoginEvent(account);

                profileState.addAccount(account, !currentProfile);

                break;
            }
            case Source.Twitter: {
                const payloadResponse = await fetchJSON<ResponseJSON<SessionPayload>>(
                    urlcat('/api/twitter/decrypt-session', {
                        ciphertext,
                        encryptKey: sha256(passcode),
                    }),
                );

                if (!payloadResponse.success) {
                    throw new Error(payloadResponse.error.message);
                }

                const payload = payloadResponse.data;
                const session = new TwitterSession(profileId, '', now, now, payload);

                if (!currentProfile) {
                    sessionHolder.resumeSession(session);
                    await TwitterAuthProvider.login();
                }
                const account = {
                    profile,
                    session,
                    origin: 'sync',
                } satisfies Account;
                profileState.addAccount(account, true);
                captureAccountLoginEvent(account);
                break;
            }
            case Source.Bsky: {
                const data = decryptedData as BskyMetricsData;
                const session = new BskySession(profileId, now, now, data.server_host, {
                    did: data.did,
                    handle: data.handle,
                    accessJwt: data.access_jwt,
                    refreshJwt: data.refresh_jwt,
                    active: true,
                });
                if (!currentProfile) {
                    sessionHolder.resumeSession(session);
                }
                const account = {
                    profile,
                    session,
                    origin: 'sync',
                } satisfies Account;
                profileState.addAccount(account, true);
                captureAccountLoginEvent(account);
                break;
            }
            default:
                safeUnreachable(source);
        }
    }

    if (enqueueMessage) {
        enqueueSuccessMessage(t`Multi-device login sessions synced successfully.`);
    }
}
