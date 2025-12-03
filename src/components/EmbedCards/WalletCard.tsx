import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';

import LinkIcon from '@/assets/link-square.svg';
import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { Image } from '@/components/Image.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tips } from '@/components/Tips/index.js';
import { NetworkType, type ProfilePageSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { Link } from '@/esm/Link.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { resolveNetworkIcon } from '@/helpers/resolveNetworkIcon.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { getAddressSecurity } from '@/providers/goplus/getAddressSecurity.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import { SolanaExplorerResolver } from '@/web3-providers/solana/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

function resolveProfileUrlBySource(source: ProfilePageSource, profiles: FireflyProfile[]) {
    const currentSourceProfiles = profiles.filter((profile) => profile.identity.source === source);
    const profile = currentSourceProfiles.find((profile) => profile.isDefault) || currentSourceProfiles[0];
    if (!profile?.identity.id) return null;
    return getProfileUrl({
        source,
        profileId: profile.identity.id,
        handle: profile.displayName,
    });
}

export const WalletCard = memo<AddressCardProps>(function WalletCard({ address, domain, children, ...rest }) {
    const isDarkMode = useIsDarkMode();
    const identity = useFireflyIdentity(Source.Wallet, address);
    const networkType = getAddressType(address);

    const { data: profiles = EMPTY_LIST } = useWalletRelatedProfiles(address);

    const { data: walletSecurity } = useQuery({
        queryKey: ['wallet', 'security', address],
        queryFn: async () => getAddressSecurity(address),
    });
    const addressLink = useMemo(() => {
        if (!networkType) return null;

        switch (networkType) {
            case NetworkType.Ethereum:
                return BlockScanExplorerResolver.addressLink(EthereumChainId.Mainnet, address);
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
    const profileUrl = getProfileUrl({ source: Source.Wallet, profileId: address });

    return (
        <>
            <div
                {...rest}
                className={classNames(
                    'flex cursor-default items-center gap-1.5 rounded-2xl border border-line bg-lightBg p-3',
                    rest.className,
                )}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <Link className="shrink-0 rounded-full ring ring-primaryBottom" href={profileUrl}>
                    <Avatar
                        className="size-12 overflow-hidden rounded-full bg-bg"
                        unoptimized
                        loading="lazy"
                        src={getStampAvatarByProfileId(Source.Wallet, walletProfile.primary_ens || address, 100)}
                        alt=""
                        size={48}
                        width={48}
                        height={48}
                    />
                </Link>
                <div className="flex min-w-0 flex-col gap-1">
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
                        <Link href={profileUrl} className="text-lg font-bold leading-6 text-main hover:underline">
                            {walletProfile.primary_ens || <Trans>Wallet</Trans>}
                        </Link>
                        {walletSecurity ? <SecurityBadge security={walletSecurity} /> : null}
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap text-secondary">
                        <Link
                            href={profileUrl}
                            className="min-w-0 truncate font-inter text-sm font-bold leading-[14px] text-secondary hover:underline"
                        >
                            {formatAddress(address, 4)}
                        </Link>
                        <CopyTextButton size={11} className="size-3.5" text={address} />
                        {addressLink ? (
                            <Link href={addressLink} className="inline-flex">
                                <LinkIcon className="size-3.5" />
                            </Link>
                        ) : null}
                    </div>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                    <div className="flex gap-2">
                        {SORTED_SOCIAL_SOURCES.map((source) => {
                            const url = resolveProfileUrlBySource(source, profiles);
                            if (!url) return null;
                            return (
                                <Link
                                    className="inline-flex items-center"
                                    key={source}
                                    href={url}
                                    rel="noreferrer noopener"
                                >
                                    <SocialSourceIcon key={source} source={source} size={24} />
                                </Link>
                            );
                        })}
                        {networkType === NetworkType.Ethereum ? (
                            <Tips identity={identity} pureWallet isAuthRequired={false} />
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
});
