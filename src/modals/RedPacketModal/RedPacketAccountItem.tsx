import { isValidAddress } from '@masknet/web3-shared-evm';
import { memo } from 'react';

import LinkOut from '@/assets/link.svg';
import { NetworkType, Source } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { resolvePlatformProfileUrl } from '@/helpers/resolvePlatformProfile.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { FireflyRedPacketAPI } from '@/providers/types/FireflyRedPacket.js';

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
    const isAddress = networkType === NetworkType.Ethereum ? isValidAddress(address) : true;
    const addressLink = isAddress ? resolveProfileUrl(Source.Wallet, address) : null;
    const profileLink =
        shareFrom && platform && platformId && !isValidAddress(shareFrom)
            ? resolvePlatformProfileUrl(
                  platform,
                  platform === FireflyRedPacketAPI.PlatformType.Lens ? shareFrom : platformId,
              )
            : null;

    if (!address && !shareFrom) return null;

    return (
        <div
            className={classNames('flex items-center gap-1 text-[14px] leading-[18px]', {
                'text-lightTextMain': !!isDarkFont,
            })}
        >
            <div>{shareFrom ? `@${shareFrom}` : ens ? ens : address ? formatAddress(address, 4) : null}</div>
            {addressLink || profileLink ? (
                <Link
                    type="button"
                    className="h-4 cursor-pointer border-none bg-none p-0"
                    href={profileLink ?? addressLink ?? ''}
                    target="_blank"
                >
                    <LinkOut className="h-4 w-4 text-lightSecond" />
                </Link>
            ) : null}
        </div>
    );
});
