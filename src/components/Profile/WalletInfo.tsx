'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { EthereumChainId } from '@masknet/web3-shared-evm';
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
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
import { useIsLarge } from '@/hooks/useMediaQuery.js';
import { Debank } from '@/providers/debank/index.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { OKX } from '@/providers/okx/index.js';
import { type WalletProfile } from '@/providers/types/Firefly.js';

interface WalletInfoProps {
    profile: WalletProfile;
}

export const WALLET_PROFILE_ACTION_ID = 'profile-action';
const HIDDEN_NET_WORTH = true;

export function WalletInfo({ profile }: WalletInfoProps) {
    const isLarge = useIsLarge();

    const avatar = profile.avatar ?? getStampAvatarByProfileId(Source.Wallet, profile.address);
    const networkType = getAddressType(profile.address);

    const addressLink =
        networkType === NetworkType.Ethereum
            ? BlockScanExplorerResolver.addressLink(EthereumChainId.Mainnet, profile.address)
            : null;

    const isMPC = isMPCWallet(profile);
    const displayName = isMPC ? t`Firefly Wallet` : profile.primary_ens || formatAddress(profile.address, 4);

    const { data: walletRelation, isLoading: isLoadingWalletRelation } = useQuery({
        queryKey: ['wallet-relation', profile.address],
        async queryFn() {
            return FireflyEndpointProvider.getWalletRelation(profile.address);
        },
    });

    const address = profile.address;
    const { data: totalBalance } = useQuery({
        queryKey: ['wallet', 'total-balance', networkType, address],
        queryFn: async () => {
            if (!networkType) return null;
            switch (networkType) {
                case NetworkType.Ethereum:
                    return Debank.getUserTotalBalance(address);
                case NetworkType.Solana:
                    return OKX.getUserSolanaTotalValue(address);
                default:
                    safeUnreachable(networkType);
                    return null;
            }
        },
        enabled: !HIDDEN_NET_WORTH,
    });

    const iconSize = 16;

    return (
        <div className="flex items-center gap-3 p-4">
            <Avatar src={avatar} alt="avatar" size={40} className="size-10 rounded-full border border-lightHighlight" />
            <div className="relative flex flex-1 flex-col">
                <div className="flex flex-col gap-2">
                    <div className="flex min-h-8 flex-row items-center justify-between" id={WALLET_PROFILE_ACTION_ID}>
                        <div className="flex flex-col">
                            <div className="flex flex-row items-center">
                                {profile.isDefault ? (
                                    <div className="my-auto mr-1 h-6 rounded bg-highlight bg-opacity-[0.16] px-2 text-[13px] font-medium leading-6 text-highlight">
                                        <Trans>Primary</Trans>
                                    </div>
                                ) : null}
                                <div className="h-6 min-w-0 truncate text-lg font-black leading-6 text-lightMain">
                                    {displayName}
                                </div>
                                <div
                                    className={classNames(
                                        'ml-1 mr-auto flex h-6 min-w-[120px] flex-row items-center gap-1.5',
                                        {
                                            'animate-pulse bg-bg': isLoadingWalletRelation,
                                        },
                                    )}
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
                                                        content={t`Verified by ${x.provider}`}
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

                    <div className="flex items-center gap-1 text-sm leading-[14px] text-secondary">
                        {isLarge ? profile.address : formatAddress(profile.address, 4)}
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
                {profile.hacked ? (
                    <p className="mt-3 rounded-lg bg-danger bg-opacity-[0.16] px-3 py-2 text-sm leading-[18px] text-danger">
                        <Trans>
                            This wallet has been flagged as compromised. Please do not trust or interact with it. Avoid
                            any transactions or sharing of sensitive information. Stay safe!
                        </Trans>
                    </p>
                ) : null}
            </div>
        </div>
    );
}
