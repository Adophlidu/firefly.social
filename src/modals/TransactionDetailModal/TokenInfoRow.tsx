import { first } from 'lodash-es';
import { type ReactNode } from 'react';

import { Image } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';

export interface TokenInfoRowProps {
    label?: ReactNode;
    tokenLogo?: string | null;
    tokenSymbol?: string | null;
    tokenName?: string | null;
    amountText?: ReactNode | null;
    amountPrefix?: '+' | '-' | '';
    amountClassName?: string;
    containerClassName?: string;
    showLabelMarginTop?: boolean;
}

export function TokenInfoRow({
    label,
    tokenLogo,
    tokenSymbol,
    tokenName,
    amountText,
    amountPrefix = '',
    amountClassName,
    containerClassName,
    showLabelMarginTop,
}: TokenInfoRowProps) {
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
                    <div className="flex flex-col">
                        <div className="text-sm font-medium text-lightMain">{tokenName}</div>
                        <div className="flex items-center justify-between text-second">
                            <span className="text-xs">{tokenSymbol}</span>
                        </div>
                    </div>
                </div>
                {amountText ? (
                    <span className={classNames(amountClassName)}>
                        {amountPrefix ? `${amountPrefix} ${amountText}` : amountText}
                    </span>
                ) : null}
            </div>
        </div>
    );
}
