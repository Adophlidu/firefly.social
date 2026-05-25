'use client';

import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { NetworkType, Source, WalletProfileDataSource } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { formatAddress, getAddressType } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { mainnet } from 'viem/chains';

import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { PredictionProfilesCard } from '@/components/Prediction/PredictionProfilesCard.js';
import { EnsName } from '@/components/Profile/EnsName.js';
import { WalletActions } from '@/components/Profile/WalletActions.js';
import { WalletProfileTags } from '@/components/Profile/WalletProfileTags.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import { getUserTotalBalance } from '@/providers/debank/getUserTotalBalance.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { getUserSolanaTotalValue } from '@/providers/okx/getUserSolanaTotalValue.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

interface WalletInfoProps {
    profile: WalletProfile;
}

export const WALLET_PROFILE_ACTION_ID = 'profile-action';

const HIDDEN_NET_WORTH = true;

function FireflyWalletText({ dataSource }: { dataSource: WalletProfileDataSource }) {
    switch (dataSource) {
        case WalletProfileDataSource.Particle:
            return <Trans>Legacy Firefly wallet</Trans>;
        case WalletProfileDataSource.Privy:
            return <Trans>Firefly wallet</Trans>;
        default:
            safeUnreachable(dataSource);
            return null;
    }
}

export function WalletInfo({ profile }: WalletInfoProps) {
    const avatar = profile.avatar ?? getStampAvatarByProfileId(Source.Wallet, profile.address);
    const networkType = getAddressType(profile.address, false);

    const addressLink =
        networkType === NetworkType.Ethereum
            ? BlockScanExplorerResolver.addressLink(mainnet.id, profile.address)
            : null;

    const isMPC = isMPCWallet(profile);
    const ensName = getEnsNameFromWalletProfile(profile);
    const showFireflyWallet = isMPC && profile.dataSource;
    const displayName = showFireflyWallet ? (
        <FireflyWalletText dataSource={profile.dataSource!} />
    ) : (
        ensName || formatAddress(profile.address, 4, undefined, false)
    );

    const address = profile.address;
    const { data: totalBalance } = useQuery({
        queryKey: ['wallet', 'total-balance', networkType, address.toLowerCase()],
        queryFn: async () => {
            if (!networkType) return null;

            switch (networkType) {
                case NetworkType.Ethereum:
                    return getUserTotalBalance(address);
                case NetworkType.Solana:
                    return getUserSolanaTotalValue(address);
                default:
                    safeUnreachable(networkType);
                    return null;
            }
        },
        enabled: !HIDDEN_NET_WORTH,
    });

    return (
        <div className="flex w-full flex-col items-start p-4">
            <div className="flex w-full flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-[54px] w-10 items-center justify-center">
                        <Avatar
                            src={avatar}
                            alt="avatar"
                            size={40}
                            className="size-10 rounded-full border border-highlight"
                        />
                    </div>
                    <div className="relative flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-col gap-2">
                            <div
                                className="flex min-h-8 min-w-0 flex-row items-center justify-between gap-2"
                                id={WALLET_PROFILE_ACTION_ID}
                            >
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <div className="h-6 min-w-0 truncate text-lg font-black leading-6 text-lightMain md:hidden">
                                        {!showFireflyWallet && ensName ? <EnsName ens={ensName} /> : displayName}
                                    </div>
                                    <div className="flex min-w-0 flex-row items-center">
                                        {profile.isDefault ? (
                                            <div className="my-auto mr-1 h-6 shrink-0 rounded bg-highlight bg-opacity-[0.16] px-2 text-[13px] font-medium leading-6 text-highlight">
                                                <Trans>Primary</Trans>
                                            </div>
                                        ) : null}
                                        <div className="h-6 min-w-0 truncate text-lg font-black leading-6 text-lightMain max-md:hidden">
                                            {!showFireflyWallet && ensName ? <EnsName ens={ensName} /> : displayName}
                                        </div>
                                        <WalletProfileTags profile={profile} />
                                    </div>
                                    {!HIDDEN_NET_WORTH ? (
                                        <div className="mt-1 text-xl font-bold leading-6">
                                            <Trans>
                                                $ {formatPrice(totalBalance ?? 0)}{' '}
                                                <span className="text-sm text-second">Net worth</span>
                                            </Trans>
                                        </div>
                                    ) : null}
                                </div>
                                <NoSSR>
                                    <WalletActions profile={profile} />
                                </NoSSR>
                            </div>

                            <div className="flex min-w-0 items-center gap-1 text-sm leading-[14px] text-secondary max-md:text-xs">
                                <span className="truncate">{profile.address}</span>
                                <NoSSR>
                                    <CopyTextButton text={profile.address} />
                                    {addressLink ? (
                                        <Link target="_blank" href={addressLink}>
                                            <LinkIcon width={14} height={14} />
                                        </Link>
                                    ) : null}
                                </NoSSR>
                            </div>
                        </div>
                    </div>
                </div>
                <PredictionProfilesCard address={profile.address} />
            </div>
            {profile.hacked ? (
                <div className="mt-3 w-full">
                    <p className="w-full rounded-lg bg-danger bg-opacity-[0.16] px-3 py-2 text-sm leading-[18px] text-danger">
                        <Trans>
                            This wallet has been flagged as compromised. Please do not trust or interact with it. Avoid
                            any transactions or sharing of sensitive information. Stay safe!
                        </Trans>
                    </p>
                </div>
            ) : null}
        </div>
    );
}
