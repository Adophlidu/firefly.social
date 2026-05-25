import type { NetworkType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { isNativeTokenAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useMemo, useState } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { Image } from '@/esm/Image.js';
import { optimizeCDNImageSize } from '@/helpers/optimizeCDNImageSize.js';
import { resolveTokenLogoURL } from '@/helpers/resolveTokenLogoURL.js';

export interface TokenIconProps extends HTMLProps<HTMLSpanElement> {
    networkType?: NetworkType;
    chainId?: number;
    address?: string;
    name?: string;
    coingeckoChain?: string;
    /** icon url */
    icon?: string;
    /** badge icon url */
    badgeIcon?: string;
    size?: number;
    badgeSize?: number;
    disableBadge?: boolean;
    badgeClassName?: string;
}

export const TokenIcon = memo(function TokenIcon({
    networkType,
    chainId,
    coingeckoChain,
    address,
    icon,
    badgeIcon,
    name,
    size = 30,
    badgeSize = 12,
    disableBadge = false,
    className,
    badgeClassName,
    ...rest
}: TokenIconProps) {
    const defaultBadgeSize = Math.max(24, Math.floor(size / 2));
    const chainSize = badgeSize || defaultBadgeSize;

    const [hasError, setHasError] = useState(false);
    const [hasErrorOptimized, setHasErrorOptimized] = useState(false);
    const onLoadError = useCallback(() => {
        if (!hasErrorOptimized) setHasErrorOptimized(true);
        else setHasError(true);
    }, [hasErrorOptimized]);

    const tokenIcon = useMemo(() => {
        if (chainId && isNativeTokenAddress(address)) {
            return resolveTokenLogoURL(chainId, address ?? '0x0000000000000000000000000000000000000000');
        }
        return icon;
    }, [icon, address, chainId]);

    const resolvedIcon = useMemo(() => {
        if (!tokenIcon) return undefined;
        return optimizeCDNImageSize(tokenIcon, size, size);
    }, [size, tokenIcon]);

    return (
        <span className={classNames('relative', className)} style={{ width: size, height: size }} {...rest}>
            {(resolvedIcon && !hasErrorOptimized) || (tokenIcon && !hasError) ? (
                <Image
                    unoptimized
                    className="rounded-full object-cover"
                    alt=""
                    src={!hasErrorOptimized ? resolvedIcon! : tokenIcon!}
                    width={size}
                    height={size}
                    style={{ width: size, height: size }}
                    onError={onLoadError}
                />
            ) : (
                <span
                    className={classNames(
                        'flex items-center justify-center rounded-full bg-main font-semibold text-primaryBottom',
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
            {!disableBadge && (badgeIcon || chainId || coingeckoChain) ? (
                <span
                    className={classNames(
                        'absolute -bottom-px overflow-hidden rounded-full bg-white p-px empty:hidden',
                        badgeClassName,
                    )}
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
                    ) : chainId || coingeckoChain ? (
                        <ChainIcon
                            size={badgeSize}
                            networkType={networkType}
                            chainId={chainId}
                            coingeckoChain={coingeckoChain}
                            allowEmpty
                        />
                    ) : null}
                </span>
            ) : null}
        </span>
    );
});
