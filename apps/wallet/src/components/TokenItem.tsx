import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { formatTokenItemAmount } from '@/helpers/formatTokenItemAmount.js';
import { multipliedBy } from '@/helpers/number.js';
import { cn } from '@/lib/utils.js';
import type { Token } from '@/providers/types/Transfer.js';

interface TokenItemProps extends ClickableButtonProps {
    token: Pick<
        Token,
        | 'price'
        | 'amount'
        | 'custom'
        | 'name'
        | 'balance'
        | 'symbol'
        | 'id'
        | 'logoUrl'
        | 'chainLogoUrl'
        | 'chainId'
        | 'decimals'
    >;
    disableChainIcon?: boolean;
    secondaryText?: ReactNode;
    withArrow?: boolean;
}

export function TokenItem({ className, token, disableChainIcon, withArrow, ...props }: TokenItemProps) {
    const usd = formatPrice(multipliedBy(token.price, token.amount).toString());
    const balance = formatTokenItemAmount(token.amount);
    const secondaryText = props.secondaryText ?? (
        <>
            {balance} {token.symbol || '-'}
        </>
    );

    return (
        <ClickableButton
            key={token.id}
            className={cn(
                'text-lightMain flex w-full items-center justify-between gap-2 rounded-lg py-3 font-bold',
                className,
            )}
            enablePropagate
            {...props}
        >
            <div className="flex min-w-0 flex-1 items-center gap-x-4">
                <TokenIcon
                    size={36}
                    badgeSize={16}
                    className="shrink-0"
                    badgeClassName="bg-white"
                    chainId={token.chainId}
                    icon={token.logoUrl}
                    badgeIcon={disableChainIcon ? undefined : token.chainLogoUrl}
                    symbol={token.symbol}
                    name={token.name}
                />
                <div className="w-full min-w-0 text-left">
                    <div className="flex h-5 w-full items-center justify-start truncate leading-5">
                        <span className="h-5 min-w-0 truncate text-sm font-semibold">{token.name}</span>
                        {token.custom ? (
                            <span className="bg-lightBg text-second ml-2.5 inline-block h-5 shrink-0 rounded px-2 text-xs font-medium leading-5">
                                <Trans>Added</Trans>
                            </span>
                        ) : null}
                        {withArrow ? <ArrowDownIcon className="ml-1 shrink-0" width={16} height={16} /> : null}
                    </div>
                    <div className="text-second w-full text-xs font-medium leading-3">{secondaryText}</div>
                </div>
            </div>
            <div className="flex flex-col items-end justify-center font-medium">
                <span>{usd ? <>${renderShrankPrice(usd)}</> : '-'}</span>
            </div>
        </ClickableButton>
    );
}
