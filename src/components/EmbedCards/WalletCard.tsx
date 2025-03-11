import { t } from '@lingui/core/macro';
import { safeUnreachable } from '@masknet/kit';
import { isSameAddress } from '@masknet/web3-shared-base';
import { ChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId } from '@masknet/web3-shared-solana';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { type Address } from 'viem';
import { useEnsName } from 'wagmi';

import LinkIcon from '@/assets/link-square.svg';
import { AddressSocialAvatar } from '@/components/AddressSocialAvatar/index.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { useWalletDisplayName } from '@/components/EmbedCards/useWalletDisplayName.js';
import { Image } from '@/components/Image.js';
import { RelatedSourceIcon } from '@/components/RelatedSourceIcon.js';
import { Tips } from '@/components/Tips/index.js';
import { Tooltip } from '@/components/Tooltip.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { resolveNetworkIcon } from '@/helpers/resolveNetworkIcon.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import { SolanaExplorerResolver } from '@/mask/index.js';
import { Debank } from '@/providers/debank/index.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { GoPlus } from '@/providers/goplus/index.js';
import { OKX } from '@/providers/okx/index.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

export const WalletCard = memo<AddressCardProps>(function WalletCard({ address, children, ...rest }) {
    const isDarkMode = useIsDarkMode();
    const identity = useFireflyIdentity(Source.Wallet, address);
    const networkType = getAddressType(address);
    const { data: ens } = useEnsName({ address: address as Address });

    const { data: profiles = EMPTY_LIST } = useWalletRelatedProfiles(address);
    const walletDisplayName = useWalletDisplayName(address);

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
    });

    const { data: walletSecurity } = useQuery({
        queryKey: ['wallet', 'security', address],
        queryFn: async () => GoPlus.getAddressSecurity(address),
    });
    const addressLink = useMemo(() => {
        if (!networkType) return null;
        switch (networkType) {
            case NetworkType.Ethereum:
                return BlockScanExplorerResolver.addressLink(ChainId.Mainnet, address);
            case NetworkType.Solana:
                return SolanaExplorerResolver.addressLink(SolanaChainId.Mainnet, address);
            default:
                safeUnreachable(networkType);
                return null;
        }
    }, [address, networkType]);

    const walletProfile = profiles.find(
        (x) => x.identity.source === Source.Wallet && isSameAddress(x.identity.id, address),
    )?.__origin__ as WalletProfile | undefined;

    if (!walletProfile) return null;

    const networkIcon = networkType ? resolveNetworkIcon(networkType, isDarkMode) : null;

    return (
        <>
            <div
                {...rest}
                className={classNames(
                    'flex items-center gap-1.5 rounded-2xl border border-line bg-bg p-3',
                    rest.className,
                )}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <div className="flex-shrink-0 rounded-full ring-[3px] ring-primaryBottom">
                    <AddressSocialAvatar
                        className="h-[80px] w-[80px] overflow-hidden rounded-full bg-bg"
                        address={address}
                        size={80}
                    />
                </div>
                <div className="flex min-w-0 flex-col gap-2 self-start">
                    <div className="flex items-center gap-1">
                        {networkIcon && networkType ? (
                            <Image
                                className="shrink-0 overflow-hidden"
                                src={networkIcon}
                                alt={networkType}
                                width={18}
                                height={18}
                            />
                        ) : null}
                        <strong className="text-lg font-bold leading-6 text-main">{formatAddress(address, 4)}</strong>
                        {walletSecurity ? <SecurityBadge security={walletSecurity} /> : null}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap text-second">
                        <span className="min-w-0 truncate font-inter text-medium font-bold leading-[14px]">
                            {walletDisplayName || walletProfile.ens || formatAddress(address, 4)}
                        </span>
                        <CopyTextButton size={11} className="h-3.5 w-3.5" text={address} />
                        {addressLink ? (
                            <Link href={addressLink} className="inline-flex">
                                <LinkIcon className="h-3.5 w-3.5" />
                            </Link>
                        ) : null}
                    </div>
                    <div className="flex gap-[10px]">
                        {walletProfile.verifiedSources.map((x) => {
                            return (
                                <Tooltip key={x.source} content={t`Verified by ${x.source}`} placement="bottom">
                                    <span>
                                        <RelatedSourceIcon source={x.source} size={24} />
                                    </span>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
                <div className="ml-auto mr-3 flex flex-col items-end justify-between self-stretch">
                    <div className="text-right text-2xl font-bold">{`$${formatPrice(totalBalance ?? 0)}`}</div>
                    <Tips identity={identity} handle={address || ens} pureWallet />
                </div>
            </div>
        </>
    );
});
