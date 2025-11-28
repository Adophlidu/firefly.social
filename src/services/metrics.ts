import { parseJson, safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { jwtDecode } from 'jwt-decode';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';
import { sha256, toHex } from 'viem';

import { Source, SourceInURL } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { TokenExpiredError } from '@/constants/error.js';
import { SEVEN_DAYS } from '@/constants/index.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getAllAccounts } from '@/helpers/getAllProfiles.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveSessionHolderFromProfileSource } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { resolveSocialSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getPublicKeyInHexFromPrivateKey } from '@/providers/farcaster/ed25519.js';
import { FAKE_SIGNER_REQUEST_TOKEN, FarcasterSession } from '@/providers/farcaster/Session.js';
import { deleteMetrics } from '@/providers/firefly/metrics/deleteMetrics.js';
import { downloadMetaInfo } from '@/providers/firefly/metrics/downloadMetaInfo.js';
import { downloadMetrics } from '@/providers/firefly/metrics/downloadMetrics.js';
import { uploadMetrics as uploadFireflyMetrics } from '@/providers/firefly/metrics/uploadMetrics.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { resolveTwitterResponseData } from '@/providers/twitter/resolveTwitterResponseData.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload } from '@/providers/twitter/SessionPayload.js';
import type { Account } from '@/providers/types/Account.js';
import type {
    CommonMetricsData,
    FarcasterMetricsData,
    LensMetricsData,
    MetricsItemToUpload,
    MetricsMetaInfo,
} from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { decryptAes256, encryptAes256 } from '@/services/crypto.js';
import type { ResponseJson } from '@/types/utility.js';

function encryptCipherText(passcode: string, text: string) {
    const key = sha256(toHex(passcode)).replace(/^0x/, '');
    return encryptAes256(text, key, env.external.NEXT_PUBLIC_PASSCODE_IV);
}

function decryptCipherText(passcode: string, text: string) {
    const key = sha256(toHex(passcode)).replace(/^0x/, '');
    return decryptAes256(text, key, env.external.NEXT_PUBLIC_PASSCODE_IV);
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
                identity_token: session.token,
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

async function getLocalMetrics(passcode: string) {
    const allAccounts = getAllAccounts();
    return Promise.all(allAccounts.map((account) => getAccountMetricsData(account, passcode)));
}

export async function uploadMetrics(passcode: string) {
    const localMetrics = await getLocalMetrics(passcode);

    const validMetrics = compact(localMetrics);
    if (!validMetrics.length) throw new Error('No valid metrics data to upload.');

    return uploadFireflyMetrics(passcode, validMetrics);
}

export async function downloadAccounts() {
    const response = await downloadMetaInfo();
    return response.metrics;
}

function isExpiredRefreshToken(token: string) {
    try {
        const payload = jwtDecode(token);
        return !!payload.exp && Date.now() >= payload.exp * 1000 - 60 * 1000;
    } catch {
        return false;
    }
}

/**
 * merge local metrics with remote metrics
 * @param passcode
 */
export async function mergeMetrics(passcode: string, enqueueMessage = true) {
    const localMetrics = await getLocalMetrics(passcode);

    const validLocalMetrics = compact(localMetrics);

    const remoteMetricsResponse = await downloadMetrics(passcode);
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

    await uploadFireflyMetrics(passcode, compact(mergedMetrics));

    const metricIdsToDelete: string[] = [];
    const newAccounts: Account[] = [];
    for (const info of remoteMetrics) {
        if (
            info.metaInfo.platform === 'bluesky' ||
            validLocalMetrics.some(
                (x) =>
                    x.metaInfo.profileId === info.metaInfo.profileId && x.metaInfo.platform === info.metaInfo.platform,
            )
        ) {
            continue;
        }

        const { platform, loginTime } = info.metaInfo;

        if (platform === 'x') {
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

        const source = resolveSocialSource(platform);
        if (!source) continue;

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

        const currentSession = getSessionFromStorageBySource(source);

        switch (source) {
            case Source.Lens: {
                const data = parseJson<LensMetricsData>(decryptCipherText(passcode, ciphertext));
                if (!data) {
                    console.warn('[mergeMetrics] Failed to decrypt lens metrics data');
                    continue;
                }
                const session = new LensSession(
                    profileId,
                    data.token,
                    now,
                    now + SEVEN_DAYS,
                    data.refresh_token,
                    data.address,
                    data.identity_token,
                );
                // TODO: maybe we can check token with api here for each session, but its too slow
                if (isExpiredRefreshToken(session.refreshToken)) {
                    metricIdsToDelete.push(`${SourceInURL.Lens}:${profileId}`);
                    if (enqueueMessage) {
                        enqueueWarningMessage(t`Your Lens login token has expired. Please sign in again.`);
                    }
                    continue;
                }

                const account = {
                    profile,
                    session,
                    origin: 'sync',
                } satisfies Account;

                if (!currentSession) {
                    try {
                        await lensSessionHolder.resumeSession(session, true);
                    } catch (error) {
                        if (error instanceof TokenExpiredError) {
                            continue;
                        }
                        throw error;
                    }
                }

                profileState.addAccount(account, !currentSession);
                captureAccountLoginEvent(account);
                newAccounts.push(account);
                break;
            }

            case Source.Farcaster: {
                const data = parseJson<FarcasterMetricsData>(decryptCipherText(passcode, ciphertext));
                if (!data) {
                    console.warn('[mergeMetrics] Failed to decrypt farcaster metrics data');
                    continue;
                }

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
                if (!currentSession) {
                    sessionHolder.resumeSession(session);
                }
                captureAccountLoginEvent(account);

                profileState.addAccount(account, !currentSession);
                newAccounts.push(account);

                break;
            }
            case Source.Twitter: {
                const payloadResponse = await fetchJson<ResponseJson<SessionPayload>>(
                    urlcat('/api/twitter/decrypt-session', {
                        ciphertext,
                        encryptKey: sha256(toHex(passcode)).replace(/^0x/, ''),
                    }),
                );
                const payload = resolveResponseData(payloadResponse);
                const session = new TwitterSession(profileId, '', now, now, payload);

                if (!currentSession) {
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
                newAccounts.push(account);
                break;
            }
            case Source.Bsky:
                break;
            default:
                safeUnreachable(source);
        }
    }

    // delete unused metrics
    if (metricIdsToDelete.length > 0) {
        runInSafeAsync(() => deleteMetrics(passcode, metricIdsToDelete));
    }

    if (enqueueMessage) {
        enqueueSuccessMessage(t`Multi-device login sessions synced successfully.`);
    }

    return { newAccounts };
}
