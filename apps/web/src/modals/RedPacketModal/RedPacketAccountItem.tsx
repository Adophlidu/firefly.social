import LinkOut from '@dimensiondev/assets/link.svg';
import { classNames } from '@dimensiondev/utils';
import { isValidAddressEthereum } from '@dimensiondev/web3-utils';
import { memo } from 'react';

import { NetworkType, Source } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolvePlatformProfileUrl } from '@/helpers/resolvePlatformProfile.js';
import type { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

interface Props {
    address?: string;
    ens?: string;
    isDarkFont?: boolean;
    shareFrom?: string;
    networkType?: NetworkType;
    platform?: FireflyRedPacketAPI.PlatformType;
    platformId?: string;
}

export const RedPacketAccountItem = memo(function RedPacketAccountItem({
    address,
    ens,
    shareFrom,
    platform,
    isDarkFont,
    platformId,
    networkType = NetworkType.Ethereum,
}: Props) {
    const isAddress_ = networkType === NetworkType.Ethereum ? isValidAddressEthereum(address) : true;
    const addressLink = isAddress_ ? getProfileUrl({ source: Source.Wallet, profileId: address }) : null;
    const profileLink =
        shareFrom && platform && !isValidAddressEthereum(shareFrom)
            ? resolvePlatformProfileUrl(platform, shareFrom)
            : null;

    if (!address && !shareFrom) return null;

    return (
        <div
            className={classNames('flex items-center gap-1 text-[14px] leading-[18px]', {
                'text-lightTextMain': !!isDarkFont,
            })}
        >
            <div>
                {shareFrom
                    ? `@${shareFrom.replace(/^@+/g, '')}`
                    : ens
                      ? ens
                      : address
                        ? formatAddress(address, 4)
                        : null}
            </div>
            {addressLink || profileLink ? (
                <Link
                    type="button"
                    className="h-4 cursor-pointer border-none bg-none p-0"
                    href={profileLink ?? addressLink ?? ''}
                    target="_blank"
                >
                    <LinkOut className="text-second size-4" />
                </Link>
            ) : null}
        </div>
    );
});
