'use client';

import { Source, SourceInURL } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';

import { WalletItem } from '@/legacy/[locale]/(settings)/components/WalletItem.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ProfileName } from '@/components/ProfileName.js';
import { openAndWaitForCloseConfirmModal } from '@/controllers/openConfirmModal.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';
import { getProfilesByIds } from '@/services/getProfilesByIds.js';

export async function getRelatedProfiles({ identities }: FireflyWalletConnection) {
    if (!identities.length) return [];
    const lensIds = identities.filter((x) => x.source === Source.Lens).map((x) => x.id);
    const farcasterIds = identities.filter((x) => x.source === Source.Farcaster).map((x) => x.id);
    return [
        ...(lensIds.length ? await getProfilesByIds(SourceInURL.Lens, lensIds) : []),
        ...(farcasterIds ? await getProfilesByIds(SourceInURL.Farcaster, farcasterIds) : []),
    ];
}

export async function waitForDisconnectConfirmation(connection: FireflyWalletConnection) {
    const profiles = await getRelatedProfiles(connection);

    return openAndWaitForCloseConfirmModal({
        title: <Trans>Disconnect</Trans>,
        content: (
            <div className="-mb-2.5 -mt-4">
                <p className="mb-3 text-[13px] text-lightMain">
                    {profiles.length ? (
                        <Trans>Confirm to disconnect this wallet and its associated account from Firefly?</Trans>
                    ) : (
                        <Trans>Confirm to disconnect this wallet from Firefly?</Trans>
                    )}
                </p>
                <WalletItem connection={connection} noAction />
                <div className="no-scrollbar max-h-[calc(63px_*_3)] overflow-y-auto">
                    {profiles.map((profile) => (
                        <div
                            key={profile.profileId}
                            className="mt-3 inline-flex h-[63px] w-full items-center justify-start gap-3 rounded-lg border border-line bg-white bg-bottom px-3 py-2 backdrop-blur dark:bg-bg"
                        >
                            <ProfileAvatar profile={profile} size={36} />
                            <ProfileName profile={profile} />
                        </div>
                    ))}
                </div>
            </div>
        ),
    });
}
