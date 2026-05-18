'use client';

import { Source } from '@dimensiondev/enums';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { SolanaExplorerResolver } from '@dimensiondev/web3/resolvers';
import { formatAddress, getAddressType, isSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { mainnet } from 'viem/chains';

import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { SecurityBadge } from '@/components/EmbedCards/TokenSecurityBadge.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { Image } from '@/components/Image.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { AddressLink } from '@/components/Tips/AddressLink.js';
import { Tips } from '@/components/Tips/index.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/computed.js';
import type { ProfilePageSource } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { getEnsNameFromWalletProfile } from '@/helpers/getEnsNameFromWalletProfile.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { resolveNetworkIcon } from '@/helpers/resolveNetworkIcon.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useWalletRelatedProfiles } from '@/hooks/useWalletRelatedProfiles.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { getAddressSecurity } from '@/providers/goplus/getAddressSecurity.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

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
        queryKey: ['wallet', 'security', address.toLowerCase()],
        queryFn: async () => getAddressSecurity(address),
    });
    const addressLink = useMemo(() => {
        if (!networkType) return null;

        switch (networkType) {
            case NetworkType.Ethereum:
                return BlockScanExplorerResolver.addressLink(mainnet.id, address);
            case NetworkType.Solana:
                return SolanaExplorerResolver.addressLink(solana.id, address);
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
                    'border-line bg-lightBg flex cursor-default items-center gap-1.5 rounded-2xl border p-3',
                    rest.className,
                )}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <Link className="ring-primaryBottom shrink-0 rounded-full ring" href={profileUrl}>
                    <Avatar
                        className="bg-bg size-12 overflow-hidden rounded-full"
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
                        <Link href={profileUrl} className="text-main text-lg font-bold leading-6 hover:underline">
                            {getEnsNameFromWalletProfile(walletProfile) || <Trans>Wallet</Trans>}
                        </Link>
                        {walletSecurity ? <SecurityBadge security={walletSecurity} /> : null}
                    </div>
                    <div className="text-secondary flex items-center gap-2 whitespace-nowrap">
                        <Link
                            href={profileUrl}
                            className="font-inter text-secondary min-w-0 truncate text-sm font-bold leading-[14px] hover:underline"
                        >
                            {formatAddress(address, 4)}
                        </Link>
                        <CopyTextButton size={11} className="size-3.5" text={address} />
                        <AddressLink address={address} networkType={networkType ?? NetworkType.Ethereum} size={14} />
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
