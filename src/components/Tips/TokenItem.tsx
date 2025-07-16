import { Trans } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { TokenIcon } from '@/components/Tips/TokenIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { isGreaterThan, multipliedBy } from '@/helpers/number.js';
import type { Token as RawToken } from '@/hooks/useCustomFungibleTokens.js';

export type Token = Pick<
    RawToken,
    | 'price'
    | 'amount'
    | 'custom'
    | 'name'
    | 'balance'
    | 'symbol'
    | 'id'
    | 'logo_url'
    | 'chainLogoUrl'
    | 'chainId'
    | 'decimals'
>;

interface TokenItemProps extends ClickableButtonProps {
    token: Token;
    disableChainIcon?: boolean;
}

export function TokenItem({ className, token, disableChainIcon, ...props }: TokenItemProps) {
    const usd = formatPrice(multipliedBy(token.price, token.amount).toString());
    const balance = useMemo(() => {
        if (isGreaterThan(token.balance, 1)) return removeTrailingZeros(BigNumber(token.balance).toFormat(2));
        return token.balance || '0';
    }, [token.balance]);

    return (
        <ClickableButton
            key={token.id}
            className={classNames(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 font-bold text-lightMain',
                className,
            )}
            enablePropagate
            {...props}
        >
            <div className="flex items-center gap-x-4">
                <TokenIcon disableChainIcon={disableChainIcon} token={token} />
                <div className="text-left">
                    <div className="h-5 w-full leading-5">
                        <span>{token.name}</span>
                        {token.custom ? (
                            <span className="ml-2.5 inline-block h-5 rounded bg-lightBg px-2 text-xs font-medium leading-5 text-second">
                                <Trans>Added</Trans>
                            </span>
                        ) : null}
                    </div>
                    <div className="w-full text-[13px] font-normal leading-[18px] text-second">
                        {balance} {token.symbol || '-'}
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end justify-center font-medium">
                <span>{usd ? <>${renderShrankPrice(usd)}</> : '-'}</span>
            </div>
        </ClickableButton>
    );
}
