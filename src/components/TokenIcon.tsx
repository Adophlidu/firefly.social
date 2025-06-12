import { first } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useMemo, useState } from 'react';

import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { type NetworkType } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { isZeroAddressEthereum } from '@/helpers/isZeroAddress.js';
import { EVMChainResolver } from '#masknet/web3-providers';

export interface TokenIconProps extends HTMLProps<HTMLSpanElement> {
    networkType?: NetworkType;
    chainId?: number;
    address?: string;
    name?: string;
    /** icon url */
    icon?: string;
    /** badge icon url */
    badgeIcon?: string;
    size?: number;
    badgeSize?: number;
    disableBadge?: boolean;
}

export const TokenIcon = memo(function TokenIcon({
    networkType,
    chainId,
    address,
    icon,
    badgeIcon,
    name,
    size = 30,
    badgeSize = 12,
    disableBadge = false,
    className,
    ...rest
}: TokenIconProps) {
    const defaultBadgeSize = Math.max(24, Math.floor(size / 2));
    const chainSize = badgeSize || defaultBadgeSize;

    const [hasError, setHasError] = useState(false);
    const onLoadError = useCallback(() => {
        setHasError(true);
    }, []);

    const tokenIcon = useMemo(() => {
        if (chainId && isZeroAddressEthereum(address)) {
            return EVMChainResolver.nativeCurrency(chainId).logoURL;
        }
        return icon;
    }, [icon, address, chainId]);

    return (
        <span className={classNames('relative', className)} style={{ width: size, height: size }} {...rest}>
            {tokenIcon && !hasError ? (
                <Image
                    unoptimized
                    className="rounded-full object-cover"
                    alt=""
                    src={tokenIcon}
                    width={size}
                    height={size}
                    style={{ width: size, height: size }}
                    onError={onLoadError}
                />
            ) : (
                <span
                    className={classNames(
                        'flex items-center justify-center rounded-full bg-bg bg-main font-semibold text-primaryBottom',
                        size < 30 ? 'text-sm' : 'text-xl',
                    )}
                    style={{
                        width: size,
                        height: size,
                    }}
                >
                    {name ? first(name) : null}
                </span>
            )}
            {!disableBadge ? (
                <span
                    className="absolute -bottom-[1px] overflow-hidden rounded-full bg-lightBottom p-[1px]"
                    style={{
                        right: -badgeSize / 2,
                    }}
                >
                    {badgeIcon ? (
                        <Image
                            unoptimized
                            className="rounded-full"
                            src={badgeIcon}
                            width={chainSize}
                            height={chainSize}
                            style={{ width: chainSize, height: chainSize }}
                            alt="chain"
                        />
                    ) : chainId ? (
                        <ChainIcon size={badgeSize} networkType={networkType} chainId={chainId} allowEmpty />
                    ) : null}
                </span>
            ) : null}
        </span>
    );
});
