import { compact } from 'lodash-es';

import { type SocialSource, Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getAccountMetricsData } from '@/helpers/getAccountMetricsData.js';
import { getAllProfiles } from '@/helpers/getAllProfiles.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { logger } from '@/libs/Logger.js';
import { ConfirmSyncSessionModalRef } from '@/modals/ConfirmSyncSessionModal/refs.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';
import { getMetricsStatus } from '@/providers/firefly/metrics/getMetricsStatus.js';
import type { LensSession } from '@/providers/lens/Session.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { downloadAccounts, mergeMetrics, uploadLocalMetrics } from '@/services/metrics.js';
import { uploadMetricsToFirefly } from '@/services/uploadMetrics.js';
import { verifyAndGetPassword } from '@/services/verifyAndGetPassword.js';

interface Options {
    forceUploadMetrics?: boolean;
    bindLensManager?: boolean;
}

async function filterProfilesWithConnection(profiles: Profile[]) {
    if (!profiles.length) return [];

    try {
        const connections = await getAllConnections();
        const connectedSocial: Array<{
            source: SocialSource;
            profileId: string;
            handle: string;
        }> = [
            ...(connections?.farcaster?.connected || []).map((x) => ({
                source: Source.Farcaster as const,
                profileId: `${x.fid}`,
                handle: x.username,
            })),
            ...(connections?.lens?.connected || [])
                .flatMap((x) => x.lens || [])
                .map((x) => ({
                    source: Source.Lens as const,
                    profileId: x.id,
                    handle: x.localName,
                })),
            ...(connections?.bsky?.connected || []).map((x) => ({
                source: Source.Bsky as const,
                profileId: x.id,
                handle: x.name,
            })),
            ...(connections?.twitter?.connected || []).map((x) => ({
                source: Source.Twitter as const,
                profileId: x.id,
                handle: x.handle,
            })),
        ];
        if (!connectedSocial.length) return profiles;

        return profiles.filter((profile) => connectedSocial.some((connection) => isSameProfile(profile, connection)));
    } catch (error) {
        logger.error('Error filtering profiles with connections', error);
        return profiles;
    }
}

async function syncMetrics(account: Account, options?: Options) {
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

    const profilesToSync = await filterProfilesWithConnection(
        remoteProfiles.filter(
            (remoteProfile) => !localProfiles.some((localProfile) => isSameProfile(localProfile, remoteProfile)),
        ),
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
                await mergeMetrics(metricsPassword);
            }
        }
    } else if (profilesToUpload.length > 0 && !isOrbTemporaryAccount) {
        metricsPassword = await verifyAndGetPassword();
        if (metricsPassword) uploadLocalMetrics(metricsPassword);
    }

    // force upload
    if (options?.forceUploadMetrics) {
        metricsPassword = metricsPassword || (await verifyAndGetPassword());
        if (metricsPassword) {
            const metricsData = await getAccountMetricsData(account, metricsPassword);
            if (metricsData) {
                await uploadMetricsToFirefly(metricsPassword, [metricsData]);
            }
        }
    }

    return;
}

export async function checkAndSyncMetrics(account: Account, options?: Options) {
    const syncStatus = await getMetricsStatus();
    if (syncStatus.hasSetPasscode) {
        await syncMetrics(account, options);
    }
}
