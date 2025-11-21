import { compact } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getAllProfiles } from '@/helpers/getAllProfiles.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { ConfirmSyncSessionModalRef } from '@/modals/ConfirmSyncSessionModal.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import { LensSession } from '@/providers/lens/Session.js';
import type { Account } from '@/providers/types/Account.js';
import { type Profile } from '@/providers/types/SocialMedia.js';
import { downloadAccounts, mergeMetrics, uploadMetrics } from '@/services/metrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';

async function syncMetrics(account: Account) {
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

    if (profilesToSync.length > 0) {
        LoginModalRef.close();
        const confirmed = await ConfirmSyncSessionModalRef.openAndWaitForClose({
            profiles: profilesToSync.filter((x) => !isSameProfile(x, account?.profile)),
        });

        if (confirmed) {
            const password = await verifyAndGetPassword({
                skipCheck: true,
            });
            if (password) mergeMetrics(password);
        }
    } else if (profilesToUpload.length > 0 && !isOrbTemporaryAccount) {
        const passcode = await verifyAndGetPassword();
        if (passcode) uploadMetrics(passcode);
    }

    return;
}

export async function checkAndSyncMetrics(account: Account, skipWaitForMetricsSyncing?: boolean) {
    const syncStatus = await getMetricsStatus();
    if (syncStatus.hasSetPasscode) {
        const syncPromise = syncMetrics(account);
        if (skipWaitForMetricsSyncing === false) {
            await syncPromise;
        }
    }
}
