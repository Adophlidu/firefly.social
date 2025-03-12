'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useAsyncFn } from 'react-use';

import { PrimaryButton } from '@/app/(settings)/components/PrimaryButton.js';
import DisconnectIcon from '@/assets/disconnect.svg';
import InfoIcon from '@/assets/info-outline.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ErrorHandler } from '@/components/ErrorHandler.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { ProfileName } from '@/components/ProfileName.js';
import { Tooltip } from '@/components/Tooltip.js';
import type { SocialSource } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAllConnectionsFormattedWithProfiles } from '@/hooks/useAllConnectionsFormattedWithProfiles.js';
import { useProfileStoreAll } from '@/hooks/useProfileStore.js';
import { DisconnectFireflyAccountModalRef } from '@/modals/controls.js';
import type { Account } from '@/providers/types/Account.js';

function DisconnectButton({ account }: { account: Pick<Account, 'profile' | 'origin'> }) {
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
                x.items.filter((connection) => {
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
        await DisconnectFireflyAccountModalRef.openAndWaitForClose({
            account,
        });
    }, [account, all, data]);

    return (
        <Tooltip placement="top" content={<Trans>Disconnect</Trans>}>
            <ClickableButton
                className="flex items-center text-medium font-bold leading-none text-main"
                disabled={loading}
                onClick={disconnect}
            >
                {loading ? (
                    <LoadingIcon size={20} />
                ) : (
                    <DisconnectIcon width={20} height={20} className="h-5 w-5 shrink-0" />
                )}
            </ClickableButton>
        </Tooltip>
    );
}

export function AccountCards() {
    const { data, isLoading, error, refetch } = useAllConnectionsFormattedWithProfiles();

    if (!data) {
        if (error || isLoading) {
            return (
                <div className="relative w-full">
                    <div
                        className={classNames('flex w-full flex-col gap-3', {
                            'opacity-0': !isLoading && !!error,
                        })}
                    >
                        {new Array(4).fill(0).map((_, i) => (
                            <div className="h-[63px] w-full animate-pulse rounded-lg bg-bg" key={i} />
                        ))}
                    </div>
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
                            {items.map(({ connection, profile, account }) => {
                                const isConnected =
                                    ('connectedAt' in connection && connection.connectedAt) ||
                                    ('connected' in connection && connection.connected);
                                return (
                                    <div
                                        key={profile.profileId}
                                        className="inline-flex h-[63px] w-full items-center justify-start gap-3 rounded-lg border border-line bg-white bg-bottom px-3 py-2 backdrop-blur dark:bg-bg"
                                    >
                                        {isConnected ? (
                                            <PrimaryButton
                                                platformId={profile.profileId}
                                                platform={resolveConnectionPlatform(source)}
                                                isDefault={connection.isDefault}
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
                                                        It is related account retrieved from connected wallets. Please
                                                        sign in to set as primary account.
                                                    </Trans>
                                                }
                                            >
                                                <InfoIcon
                                                    width={20}
                                                    height={20}
                                                    className="h-5 w-5 shrink-0 text-second"
                                                />
                                            </Tooltip>
                                        )}
                                        <ProfileAvatar profile={profile} size={36} />
                                        <ProfileName profile={profile} />
                                        {isConnected ? (
                                            <DisconnectButton account={{ profile, origin: account?.origin }} />
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
        </div>
    );
}
