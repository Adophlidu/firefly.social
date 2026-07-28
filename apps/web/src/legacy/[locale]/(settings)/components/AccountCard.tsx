'use client';

import DisconnectIcon from '@dimensiondev/assets/disconnect.svg';
import InfoIcon from '@dimensiondev/assets/info-outline.svg';
import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import { ErrorHandler } from '@/components/ErrorHandler.js';
import { IconButton } from '@/components/IconButton.js';
import { Loading } from '@/components/Loading.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ProfileName } from '@/components/ProfileName.js';
import { Tooltip } from '@/components/Tooltip.js';
import { openAndWaitForCloseDisconnectFireflyAccountModal } from '@/controllers/openDisconnectFireflyAccountModal.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getSessionsFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAllConnectionsFormattedWithProfiles } from '@/hooks/useAllConnectionsFormattedWithProfiles.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { FarcasterAccountActions } from '@/legacy/[locale]/(settings)/components/FarcasterAccountActions.js';
import { LensAccountActions } from '@/legacy/[locale]/(settings)/components/LensAccountActions.js';
import { PrimaryButton } from '@/legacy/[locale]/(settings)/components/PrimaryButton.js';
import { checkBatchCustodyWallet } from '@/providers/firefly/endpoint/checkBatchCustodyWallet.js';
import type { Account } from '@/providers/types/Account.js';
import type { LensConnection } from '@/providers/types/Firefly.js';

function DisconnectButton({ account, disabled }: { account: Pick<Account, 'profile' | 'origin'>; disabled?: boolean }) {
    const all = useProfileStoreAll();
    const { data } = useAllConnectionsFormattedWithProfiles();
    const [{ loading }, disconnect] = useAsyncFn(async () => {
        const localAccounts = Object.keys(all)
            .map((k) => {
                const key = k as SocialSource;
                return all[key]?.accounts;
            })
            .filter((x) => x)
            .flat();
        const accounts =
            data?.socialConnections.flatMap((x) =>
                x.items.filter(({ connection }) => {
                    return (
                        ('connectedAt' in connection && connection.connectedAt) ||
                        ('connected' in connection && connection.connected)
                    );
                }),
            ) ?? [];
        if (
            accounts.length <= 1 ||
            (localAccounts.length <= 1 && localAccounts.some((a) => isSameProfile(a.profile, account.profile)))
        ) {
            enqueueErrorMessage(
                t`Failed to disconnect. Please leave at least 1 account or wallet address connected to keep your immersive experience in Firefly.`,
            );
            return;
        }
        await openAndWaitForCloseDisconnectFireflyAccountModal({
            account,
        });
    }, [account, all, data]);

    return (
        <IconButton
            onlyLoading
            aria-label="Disconnect"
            loading={loading}
            disabled={disabled}
            className={classNames({ '!opacity-40': !!disabled })}
            tooltip={<Trans>Disconnect</Trans>}
            onClick={disabled ? undefined : disconnect}
        >
            <DisconnectIcon width={20} height={20} className="size-5 shrink-0" />
        </IconButton>
    );
}

export function AccountCards() {
    const { data, isLoading, error, refetch } = useAllConnectionsFormattedWithProfiles();

    const farcasterFids = useMemo(() => {
        if (!data) return [];
        return data.socialConnections
            .filter(({ source }) => source === Source.Farcaster)
            .flatMap(({ items }) =>
                items
                    .filter(({ connection }) => {
                        return (
                            ('connectedAt' in connection && connection.connectedAt) ||
                            ('connected' in connection && connection.connected)
                        );
                    })
                    .map(({ profile }) => profile.profileId),
            );
    }, [data]);

    const { data: custodyWalletData, isLoading: isCustodyWalletLoading } = useQuery({
        queryKey: ['checkBatchCustodyWallet', farcasterFids.sort()],
        queryFn: async () => {
            if (farcasterFids.length === 0) return {};
            return checkBatchCustodyWallet(farcasterFids);
        },
        enabled: farcasterFids.length > 0,
    });

    if (isLoading || isCustodyWalletLoading) {
        return <Loading />;
    }

    if (!data) {
        if (error) {
            return (
                <div className="relative w-full">
                    {!isLoading && error ? (
                        <ErrorHandler reset={refetch} error={error} className="absolute left-0 top-0 !h-full w-full" />
                    ) : null}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="flex w-full flex-col gap-6">
            {data.socialConnections
                .filter(({ items }) => items.length)
                .map(({ source, items }) => {
                    return (
                        <div className="flex w-full flex-col gap-3" key={source}>
                            <div className="flex w-full items-center justify-between">
                                <span className="text-base font-bold leading-[18px] text-main">
                                    {resolveSourceName(source)}
                                </span>
                            </div>
                            <AnimatePresence mode="wait">
                                {items.map(({ connection, profile, account }) => {
                                    const isConnected =
                                        ('connectedAt' in connection && connection.connectedAt) ||
                                        ('connected' in connection && connection.connected);

                                    const isCustodyWallet = custodyWalletData?.[profile.profileId] === true;

                                    // Lens accounts sourced from `lens-account` cannot be set as
                                    // primary or disconnected; their action buttons are dimmed.
                                    const isActionRestricted =
                                        source === Source.Lens &&
                                        (connection as LensConnection).canDisconnect === false;

                                    return (
                                        <motion.div
                                            key={profile.profileId}
                                            layoutId={profile.profileId}
                                            className="inline-flex h-[63px] w-full items-center justify-start gap-3 rounded-lg border border-line bg-white bg-bottom px-3 py-2 backdrop-blur dark:bg-bg"
                                        >
                                            {isConnected ? (
                                                <PrimaryButton
                                                    platformId={connection.id}
                                                    platform={resolveConnectionPlatform(source)}
                                                    isDefault={connection.isDefault}
                                                    profile={profile}
                                                    disabled={isActionRestricted}
                                                    tooltipContent={
                                                        connection.isDefault ? (
                                                            <Trans>Primary account</Trans>
                                                        ) : (
                                                            <Trans>Set as primary account</Trans>
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <Tooltip
                                                    placement="top"
                                                    content={
                                                        <Trans>
                                                            It is related account retrieved from connected wallets.
                                                            Please sign in to set as primary account.
                                                        </Trans>
                                                    }
                                                >
                                                    <InfoIcon
                                                        width={20}
                                                        height={20}
                                                        className="size-5 shrink-0 text-second"
                                                    />
                                                </Tooltip>
                                            )}
                                            <ProfileAvatar
                                                profile={profile}
                                                size={36}
                                                enableDefaultAvatar={profile.source === Source.Lens}
                                            />
                                            <ProfileName profile={profile} />
                                            <div className="ml-auto flex items-center gap-2">
                                                {isConnected ? (
                                                    <>
                                                        {source === Source.Farcaster &&
                                                        getSessionsFromStorageBySource(Source.Farcaster).some(
                                                            (x) => x.profileId === profile.profileId,
                                                        ) ? (
                                                            <FarcasterAccountActions
                                                                profile={profile}
                                                                isCustodyWallet={isCustodyWallet}
                                                            />
                                                        ) : null}
                                                        {source === Source.Lens ? (
                                                            <LensAccountActions profile={profile} />
                                                        ) : null}
                                                        <DisconnectButton
                                                            account={{ profile, origin: account?.origin }}
                                                            disabled={isActionRestricted}
                                                        />
                                                    </>
                                                ) : null}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    );
                })}
        </div>
    );
}
