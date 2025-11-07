'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import EnsIcon from '@/assets/ens.svg';
import MiniEnsIcon from '@/assets/ens-16.svg';
import EvmIcon from '@/assets/evm.svg';
import LinkIcon from '@/assets/link-square.svg';
import SolanaIcon from '@/assets/solana.svg';
import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { WalletActions } from '@/components/Profile/WalletActions.js';
import { RelatedSourceIcon } from '@/components/RelatedSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import { getUserTotalBalance } from '@/providers/debank/getUserTotalBalance.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { getUserSolanaTotalValue } from '@/providers/okx/getUserSolanaTotalValue.js';
import {
    RelatedWalletSource,
    type VerifiedSource,
    type WalletProfile,
    WalletProfileDataSource,
} from '@/providers/types/Firefly.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface WalletInfoProps {
    profile: WalletProfile;
}

export const WALLET_PROFILE_ACTION_ID = 'profile-action';
const HIDDEN_NET_WORTH = true;

function resolveVerifiedText({ source, provider }: VerifiedSource) {
    switch (source) {
        case RelatedWalletSource.farcaster:
            return <Trans>Verified by Farcaster</Trans>;
        case RelatedWalletSource.lens:
            return <Trans>Verified by Lens</Trans>;
        case RelatedWalletSource.firefly:
        case RelatedWalletSource.twitter:
            return <Trans>Verified by Firefly</Trans>;
        case RelatedWalletSource.cyber:
        case RelatedWalletSource.hand_writing:
        case RelatedWalletSource.opensea:
        case RelatedWalletSource.pfp:
        case RelatedWalletSource.rss3:
        case RelatedWalletSource.twitter_hexagon:
        case RelatedWalletSource.uniswap:
        case RelatedWalletSource.ethLeaderboard:
        case RelatedWalletSource.other:
        case RelatedWalletSource.particle:
            return <Trans>Verified by {provider}</Trans>;
        default:
            safeUnreachable(source);
            return <Trans>Verified by {provider}</Trans>;
    }
}

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
            ? BlockScanExplorerResolver.addressLink(EthereumChainId.Mainnet, profile.address)
            : null;

    const isMPC = isMPCWallet(profile);
    const displayName =
        isMPC && profile.dataSource ? (
            <FireflyWalletText dataSource={profile.dataSource} />
        ) : (
            profile.primary_ens || formatAddress(profile.address, 4, undefined, false)
        );

    const { data: walletRelation, isLoading: isLoadingWalletRelation } = useQuery({
        queryKey: ['wallet-relation', profile.address],
        async queryFn() {
            return fireflyWalletProvider.getWalletRelation(profile.address);
        },
    });

    const address = profile.address;
    const { data: totalBalance } = useQuery({
        queryKey: ['wallet', 'total-balance', networkType, address],
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

    const iconSize = 16;

    return (
        <div className="flex w-full flex-col items-start p-4">
            <div className="flex w-full items-start gap-3">
                <div className="flex h-[54px] w-10 items-center justify-center">
                    <Avatar
                        src={avatar}
                        alt="avatar"
                        size={40}
                        className="size-10 rounded-full border border-highlight"
                    />
                </div>
                <div className="relative flex flex-1 flex-col">
                    <div className="flex flex-col gap-2">
                        <div
                            className="flex min-h-8 flex-row items-center justify-between"
                            id={WALLET_PROFILE_ACTION_ID}
                        >
                            <div className="flex flex-col">
                                <div className="h-6 min-w-0 truncate text-lg font-black leading-6 text-lightMain md:hidden">
                                    {displayName}
                                </div>
                                <div className="flex flex-row items-center">
                                    {profile.isDefault ? (
                                        <div className="my-auto mr-1 h-6 rounded bg-highlight bg-opacity-[0.16] px-2 text-[13px] font-medium leading-6 text-highlight">
                                            <Trans>Primary</Trans>
                                        </div>
                                    ) : null}
                                    <div className="h-6 min-w-0 truncate text-lg font-black leading-6 text-lightMain max-md:hidden">
                                        {displayName}
                                    </div>
                                    <div
                                        className={classNames('ml-1 mr-auto flex h-6 flex-row items-center gap-1.5', {
                                            'min-w-[120px] animate-pulse bg-bg': isLoadingWalletRelation,
                                        })}
                                    >
                                        {!isLoadingWalletRelation ? (
                                            <>
                                                {networkType === NetworkType.Ethereum ? (
                                                    <EvmIcon width={iconSize} height={iconSize} />
                                                ) : null}
                                                {networkType === NetworkType.Solana ? (
                                                    <SolanaIcon width={iconSize} height={iconSize} />
                                                ) : null}
                                                {walletRelation?.verifiedSources.map((x) => {
                                                    return (
                                                        <Tooltip
                                                            key={x.source}
                                                            content={resolveVerifiedText(x)}
                                                            placement="bottom"
                                                        >
                                                            <RelatedSourceIcon source={x.source} size={iconSize} />
                                                        </Tooltip>
                                                    );
                                                })}
                                                {profile.ens?.length ? (
                                                    <InteractiveTippy
                                                        maxWidth={304}
                                                        className="tippy-card"
                                                        placement="bottom"
                                                        content={
                                                            <div className="no-scrollbar flex max-h-[100px] flex-wrap gap-x-[15px] overflow-auto rounded-2xl border-[0.5px] border-secondaryLine bg-primaryBottom p-3">
                                                                {profile.ens.map((ens) => {
                                                                    return (
                                                                        <div
                                                                            className="flex items-center gap-[5px]"
                                                                            key={ens}
                                                                        >
                                                                            <MiniEnsIcon width={16} height={16} />
                                                                            <span className="text-[10px] font-bold leading-4 text-main">
                                                                                {ens}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        }
                                                    >
                                                        <span>
                                                            <EnsIcon
                                                                width={iconSize}
                                                                height={iconSize}
                                                                className="grayscale"
                                                            />
                                                        </span>
                                                    </InteractiveTippy>
                                                ) : null}
                                            </>
                                        ) : null}
                                    </div>
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

                        <div className="flex items-center gap-1 text-sm leading-[14px] text-secondary max-md:break-all max-md:text-xs">
                            {profile.address}
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
            {profile.hacked ? (
                <div className="mt-3 md:ml-1">
                    <p className="rounded-lg bg-danger bg-opacity-[0.16] px-3 py-2 text-sm leading-[18px] text-danger md:ml-12">
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
