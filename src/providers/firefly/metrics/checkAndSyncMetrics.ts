import { compact } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getAllProfiles } from '@/helpers/getAllProfiles.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { ConfirmSyncSessionModalRef } from '@/modals/ConfirmSyncSessionModal.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { uploadMetrics as uploadFireflyMetrics } from '@/providers/firefly/metrics/uploadMetrics.js';
import { LensSession } from '@/providers/lens/Session.js';
import { setPrivyAsLensManager } from '@/providers/lens/setPrivyAsLensManager.js';
import type { Account } from '@/providers/types/Account.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { downloadAccounts, getAccountMetricsData, mergeMetrics, uploadMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';

interface BaseOptions {
    forceUpload?: boolean;
    setLensManager?: boolean;
}

async function syncMetrics(account: Account, options?: BaseOptions) {
    const remoteAccounts = await downloadAccounts();
    const remoteProfiles = compact(
        remoteAccounts.map(({ metaInfo }) => {
            if (metaInfo.platform === 'bluesky') {
                return null;
            }
            const source = resolveSocialSource(metaInfo.platform);

            return {
                ...createDummyProfile(source),
                profileId: metaInfo.profileId,
                handle: metaInfo.profileHandle,
                displayName: metaInfo.name,
                pfp: metaInfo.avatar,
            } satisfies Profile;
        }),
    );

    const localProfiles = getAllProfiles();

    const profilesToSync = remoteProfiles.filter(
        (remoteProfile) => !localProfiles.some((localProfile) => isSameProfile(localProfile, remoteProfile)),
    );

    const profilesToUpload = localProfiles.filter((localProfile) => {
        return (
            localProfile.source !== Source.Bsky ||
            !remoteProfiles.some((remoteProfile) => isSameProfile(localProfile, remoteProfile))
        );
    });

    const isOrbTemporaryAccount =
        account?.profile.source === Source.Lens && !(account.session as LensSession).refreshToken;

    let metricsPassword: string | null = null;
    if (profilesToSync.length > 0) {
        LoginModalRef.close();
        const confirmed = await ConfirmSyncSessionModalRef.openAndWaitForClose({
            profiles: profilesToSync.filter((x) => !isSameProfile(x, account?.profile)),
        });

        if (confirmed) {
            metricsPassword = await verifyAndGetPassword({
                skipCheck: true,
            });
            if (metricsPassword) {
                const { newAccounts } = await mergeMetrics(metricsPassword);
                const lensAccounts = newAccounts.filter((x) => x.profile.profileSource === Source.Lens);
                if (lensAccounts.length === 1 && options?.setLensManager) {
                    await runInSafeAsync(() => setPrivyAsLensManager(lensAccounts[0]));
                }
            }
        }
    } else if (profilesToUpload.length > 0 && !isOrbTemporaryAccount) {
        metricsPassword = await verifyAndGetPassword();
        if (metricsPassword) uploadMetrics(metricsPassword);
    }

    // force upload
    if (options?.forceUpload) {
        metricsPassword = metricsPassword || (await verifyAndGetPassword());
        if (metricsPassword) {
            const metricsData = await getAccountMetricsData(account, metricsPassword);
            if (metricsData) {
                await uploadFireflyMetrics(metricsPassword, [metricsData]);
            }
        }
    }

    return;
}

interface Options extends BaseOptions {
    skipWaitForMetricsSyncing?: boolean;
}

export async function checkAndSyncMetrics(account: Account, options?: Options) {
    const syncStatus = await getMetricsStatus();
    if (syncStatus.hasSetPasscode) {
        const syncPromise = syncMetrics(account, options);
        if (options?.skipWaitForMetricsSyncing === false) {
            await syncPromise;
        }
    }
}
