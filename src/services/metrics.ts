import { parseJson, safeUnreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { compact } from 'lodash-es';
import urlcat from 'urlcat';
import { sha256, toHex } from 'viem';

import { Source, SourceInURL } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SessionExpiredError } from '@/constants/error.js';
import { SEVEN_DAYS } from '@/constants/static.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { enqueueSuccessMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { ensureHexPrefix } from '@/helpers/ensureHexPrefix.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getAccountMetricsData } from '@/helpers/getAccountMetricsData.js';
import { getAllAccounts } from '@/helpers/getAllProfiles.js';
import { getProfileState } from '@/helpers/getProfileState.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { resolveResponseData } from '@/helpers/resolveResponseData.js';
import { resolveSessionHolderFromProfileSource } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { logger } from '@/libs/Logger.js';
import { FAKE_SIGNER_REQUEST_TOKEN, FarcasterSession } from '@/providers/farcaster/Session.js';
import { deleteMetrics } from '@/providers/firefly/metrics/deleteMetrics.js';
import { downloadMetaInfo } from '@/providers/firefly/metrics/downloadMetaInfo.js';
import { downloadMetrics } from '@/providers/firefly/metrics/downloadMetrics.js';
import { ensureLensSessionIsValid } from '@/providers/lens/ensureLensSessionIsValid.js';
import { LensSession } from '@/providers/lens/Session.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import { captureAccountLoginEvent } from '@/providers/telemetry/captureAccountEvent.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';
import { type SessionPayload } from '@/providers/twitter/SessionPayload.js';
import { type Account } from '@/providers/types/Account.js';
import {
    type FarcasterMetricsData,
    type LensMetricsData,
    type MetricsItemToUpload,
} from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { decryptAes256 } from '@/services/crypto.js';
import { uploadMetricsToFirefly } from '@/services/uploadMetrics.js';
import { type ResponseJson } from '@/types/utility.js';

function decryptCipherText(passcode: string, text: string) {
    const key = sha256(toHex(passcode)).replace(/^0x/, '');
    return decryptAes256(text, key, env.external.NEXT_PUBLIC_PASSCODE_IV);
}

async function getLocalMetrics(passcode: string) {
    const allAccounts = getAllAccounts();
    return Promise.all(allAccounts.map((account) => getAccountMetricsData(account, passcode)));
}

export async function uploadLocalMetrics(passcode: string) {
    const localMetrics = await getLocalMetrics(passcode);

    const validMetrics = compact(localMetrics);
    if (!validMetrics.length) throw new Error('No valid metrics data to upload.');

    return uploadMetricsToFirefly(passcode, validMetrics);
}

export async function downloadAccounts() {
    const response = await downloadMetaInfo();
    return response.metrics;
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
    const mergedMetrics: MetricsItemToUpload[] = remoteMetrics.map((item) => {
        const platform = item.metaInfo.platform;
        return {
            source: platform === 'bluesky' ? Source.Bsky : resolveSocialSource(platform),
            metrics: { ...item },
        };
    });
    for (const localMetric of validLocalMetrics) {
        const { platform, profileId } = localMetric.metrics.metaInfo;
        const index = remoteMetrics.findIndex(
            (metric) => metric.metaInfo.platform === platform && metric.metaInfo.profileId === profileId,
        );

        if (index !== -1) {
            mergedMetrics[index] = localMetric;
        } else {
            mergedMetrics.push(localMetric);
        }
    }

    await uploadMetricsToFirefly(passcode, compact(mergedMetrics));

    const metricIdsToDelete: string[] = [];
    const newAccounts: Account[] = [];
    for (const info of remoteMetrics) {
        if (
            info.metaInfo.platform === 'bluesky' ||
            validLocalMetrics.some(
                (x) =>
                    x.metrics.metaInfo.profileId === info.metaInfo.profileId &&
                    x.metrics.metaInfo.platform === info.metaInfo.platform,
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
            isProUser: undefined,
        } satisfies Profile;

        const currentSession = getSessionFromStorageBySource(source);

        switch (source) {
            case Source.Lens: {
                const data = parseJson<LensMetricsData>(decryptCipherText(passcode, ciphertext));
                if (!data) {
                    logger.warn('[mergeMetrics] Failed to decrypt lens metrics data');
                    continue;
                }
                let session = new LensSession(
                    profileId,
                    data.token,
                    now,
                    now + SEVEN_DAYS,
                    data.refresh_token,
                    data.address,
                    data.identity_token,
                );
                try {
                    session = await ensureLensSessionIsValid(session);
                } catch (error) {
                    if (error instanceof SessionExpiredError) {
                        metricIdsToDelete.push(`${SourceInURL.Lens}:${profileId}`);
                        if (enqueueMessage) {
                            enqueueWarningMessage(t`Your Lens login token has expired. Please sign in again.`);
                        }
                        continue;
                    }
                }

                const account = {
                    profile,
                    session,
                    origin: 'sync',
                } satisfies Account;
                profileState.addAccount(account, !currentSession);
                if (!currentSession) {
                    await lensSessionHolder.resumeSession(session);
                    await runInSafeAsync(() => setPrivyAsLensManager(account));
                }

                captureAccountLoginEvent(account);
                newAccounts.push(account);
                break;
            }

            case Source.Farcaster: {
                const data = parseJson<FarcasterMetricsData>(decryptCipherText(passcode, ciphertext));
                if (!data) {
                    logger.warn('[mergeMetrics] Failed to decrypt farcaster metrics data');
                    continue;
                }

                const session = new FarcasterSession(
                    profileId,
                    ensureHexPrefix(data.signer_private_key),
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
                if (!currentSession) {
                    await runInSafeAsync(() => getProfileState(source)?.refreshCurrentAccount(false));
                }
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
