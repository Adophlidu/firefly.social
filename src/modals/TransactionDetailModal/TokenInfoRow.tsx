import { first } from 'lodash-es';
import { type ReactNode, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { isZero, multipliedBy } from '@/helpers/number.js';
import { resolveTokenPageUrl } from '@/helpers/resolveTokenPageUrl.js';
import { useFungibleTokenPrice } from '@/hooks/useFungibleTokenPrice.js';
import { TransactionDetailModalRef } from '@/modals/TransactionDetailModal/TransactionDetailModal.js';

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
                    className={classNames(
                        'text-left text-[14px] font-medium leading-[20px] text-secondary',
                        showLabelMarginTop ? 'mt-3' : undefined,
                    )}
                >
                    {label}
                </div>
            ) : null}
            <div
                className={classNames(
                    'flex items-center justify-between gap-2 rounded-lg bg-bg p-3',
                    containerClassName,
                )}
            >
                <div className="flex items-center gap-2">
                    <Link href={tokenPageUrl} onClick={() => TransactionDetailModalRef.close()}>
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
                        <Link href={tokenPageUrl} onClick={() => TransactionDetailModalRef.close()}>
                            <div className="text-sm font-medium text-lightMain">{tokenName}</div>
                        </Link>
                        <div className="flex items-center justify-between text-second">
                            <span className="text-xs">{tokenSymbol}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    {amountText ? (
                        <span className={classNames('text-sm font-medium', amountClassName)}>
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
