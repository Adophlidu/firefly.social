import type { HTMLProps } from 'react';

import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import type { NetworkType } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';

interface TokenIconProps extends HTMLProps<HTMLSpanElement> {
    networkType?: NetworkType;
    chainId: number;
    name?: string;
    /** icon url */
    icon?: string;
    /** badge icon url */
    badgeIcon?: string;
    size?: number;
    badgeSize?: number;
    disableBadge?: boolean;
}

export function TokenIcon({
    networkType,
    chainId,
    icon,
    badgeIcon,
    name,
    size = 30,
    badgeSize = 12,
    disableBadge: disableBadge = false,
    className,
    ...rest
}: TokenIconProps) {
    const defaultBadgeSize = Math.max(24, Math.floor(size / 2));
    return (
        <span className={classNames('relative', className)} {...rest}>
            {icon ? (
                <Image unoptimized className="rounded-full" alt={''} src={icon} width={size} height={size} />
            ) : (
                <span
                    className="block rounded-full bg-lightBg"
                    style={{
                        width: size,
                        height: size,
                    }}
                />
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
                            width={badgeSize || defaultBadgeSize}
                            height={badgeSize || defaultBadgeSize}
                            alt="chain"
                        />
                    ) : (
                        <ChainIcon size={badgeSize} networkType={networkType} chainId={chainId} />
                    )}
                </span>
            ) : null}
        </span>
    );
}
