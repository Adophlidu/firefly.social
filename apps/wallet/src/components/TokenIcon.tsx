import { first } from 'lodash-es';
import { type HTMLProps, memo, useCallback, useState } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { Image } from '@/components/Image.js';
import type { NetworkType } from '@/constants/enum.js';
import { cn } from '@/lib/utils.js';

export interface TokenIconProps extends HTMLProps<HTMLSpanElement> {
    networkType?: NetworkType;
    chainId?: number;
    address?: string;
    name?: string;
    symbol?: string;
    /** icon url */
    icon?: string;
    /** badge icon url */
    badgeIcon?: string;
    roundedSquareBadge?: boolean;
    size?: number;
    badgeSize?: number;
    disableBadge?: boolean;
    badgeClassName?: string;
}

export const TokenIcon = memo(function TokenIcon({
    networkType,
    chainId,
    address,
    icon,
    badgeIcon,
    roundedSquareBadge,
    name,
    symbol,
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
    const onLoadError = useCallback(() => {
        setHasError(true);
    }, []);

    return (
        <span className={cn('relative', className)} style={{ width: size, height: size }} {...rest}>
            {icon && !hasError ? (
                <Image
                    unoptimized
                    className="rounded-full object-cover"
                    alt=""
                    src={icon}
                    width={size}
                    height={size}
                    style={{ width: size, height: size }}
                    onError={onLoadError}
                />
            ) : (
                <span
                    className={cn(
                        'bg-bg bg-main text-primaryBottom flex items-center justify-center rounded-full font-semibold',
                        size < 30 ? 'text-sm' : 'text-xl',
                    )}
                    style={{
                        width: size,
                        height: size,
                    }}
                >
                    {symbol ? first(symbol) : name ? first(name) : null}
                </span>
            )}
            {!disableBadge && (badgeIcon || chainId) ? (
                <span
                    className={cn(
                        'absolute -bottom-px overflow-hidden bg-white p-px empty:hidden',
                        badgeClassName,
                        roundedSquareBadge ? 'border-line box-border rounded-[4px] border' : 'rounded-full',
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
                    ) : chainId ? (
                        <ChainIcon size={badgeSize} networkType={networkType} chainId={chainId} />
                    ) : null}
                </span>
            ) : null}
        </span>
    );
});
