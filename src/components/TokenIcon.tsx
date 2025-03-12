import { isZeroAddress } from '@masknet/web3-shared-evm';
import { type HTMLProps, memo, useCallback, useMemo, useState } from 'react';

import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { NetworkPluginID, type NetworkType } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

interface TokenIconProps extends HTMLProps<HTMLSpanElement> {
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
    disableBadge: disableBadge = false,
    className,
    ...rest
}: TokenIconProps) {
    const isDarkMode = useIsDarkMode();

    const defaultBadgeSize = Math.max(24, Math.floor(size / 2));
    const chainSize = badgeSize || defaultBadgeSize;
    const defaultFallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';

    const [hasError, setHasError] = useState(false);
    const onLoadError = useCallback(() => {
        setHasError(true);
    }, []);

    const tokenIcon = useMemo(() => {
        if (address && isZeroAddress(address) && chainId) {
            return getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, chainId)?.icon;
        }
        return !icon || hasError || icon === 'missing.png' ? defaultFallbackUrl : icon;
    }, [icon, hasError, defaultFallbackUrl, address, chainId]);

    return (
        <span className={classNames('relative', className)} style={{ width: size, height: size }} {...rest}>
            {tokenIcon ? (
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
