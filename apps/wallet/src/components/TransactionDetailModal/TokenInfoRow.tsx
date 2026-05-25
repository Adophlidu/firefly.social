import { isZero, multipliedBy } from '@dimensiondev/web3/numbers';
import { Link } from '@tanstack/react-router';
import { first } from 'lodash-es';
import { type MouseEvent, type ReactNode, useMemo } from 'react';

import { Image } from '@/components/Image.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useFungibleTokenPrice } from '@/hooks/useFungibleTokenPrice.js';
import { cn } from '@/lib/utils.js';

export interface TokenInfoRowProps {
    label?: ReactNode;
    tokenLogo?: string | null;
    tokenSymbol?: string | null;
    tokenName?: string | null;
    chainId: number;
    amountText?: ReactNode | null;
    amountPrefix?: '+' | '-' | '';
    amountClassName?: string;
    containerClassName?: string;
    showLabelMarginTop?: boolean;
    address?: string;
    amount?: string;
    price?: string;
    onNavigate?: (href: string) => void;
}

function shouldHandleNavigation(event: MouseEvent<HTMLAnchorElement>) {
    return (
        !event.defaultPrevented &&
        event.button === 0 &&
        !event.metaKey &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.shiftKey
    );
}

export function TokenInfoRow({
    label,
    tokenLogo,
    tokenSymbol,
    tokenName,
    chainId,
    amountText,
    amountPrefix = '',
    amountClassName,
    containerClassName,
    showLabelMarginTop,
    address,
    amount,
    price,
    onNavigate,
}: TokenInfoRowProps) {
    const tokenPageUrl = resolveTokenPageUrl({
        chainId,
        identity: tokenSymbol ?? '',
    });

    const { data: tokenPrice } = useFungibleTokenPrice(!price || isZero(price) ? address : '', { chainId });

    const finalPrice = price && !isZero(price) ? price : tokenPrice;

    const amountUSD = useMemo(() => {
        if (!finalPrice || !amount) return;
        return formatTokenUSD(multipliedBy(amount, finalPrice).toString());
    }, [amount, finalPrice]);

    return (
        <div>
            {label ? (
                <div
                    className={cn(
                        'text-left text-sm font-medium text-secondary',
                        showLabelMarginTop ? 'mt-3' : undefined,
                    )}
                >
                    {label}
                </div>
            ) : null}
            <div className={cn('flex items-center justify-between gap-2 rounded-lg bg-bg p-3', containerClassName)}>
                <div className="flex items-center gap-2">
                    <Link
                        to={tokenPageUrl}
                        onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                            if (!onNavigate || !tokenPageUrl || !shouldHandleNavigation(event)) return;
                            event.preventDefault();
                            onNavigate(tokenPageUrl);
                        }}
                    >
                        {tokenLogo ? (
                            <Image
                                src={tokenLogo}
                                alt={tokenSymbol ?? ''}
                                width={32}
                                height={32}
                                className="size-8 rounded-full"
                            />
                        ) : tokenSymbol ? (
                            <div className="flex size-8 items-center justify-center rounded-full bg-bg text-second">
                                {first(tokenSymbol)}
                            </div>
                        ) : null}
                    </Link>
                    <div className="flex flex-col">
                        <Link
                            to={tokenPageUrl}
                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                if (!onNavigate || !tokenPageUrl || !shouldHandleNavigation(event)) return;
                                event.preventDefault();
                                onNavigate(tokenPageUrl);
                            }}
                        >
                            <div className="text-sm font-medium text-lightMain">{tokenName}</div>
                        </Link>
                        <div className="flex items-center justify-between text-second">
                            <span className="text-xs">{tokenSymbol}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    {amountText ? (
                        <span className={cn('text-sm font-medium', amountClassName)}>
                            {amountPrefix ? (
                                <>
                                    {`${amountPrefix} `}
                                    {amountText}
                                </>
                            ) : (
                                amountText
                            )}
                        </span>
                    ) : null}
                    <span className="text-right text-xs leading-[14px] text-secondary">{amountUSD}</span>
                </div>
            </div>
        </div>
    );
}
