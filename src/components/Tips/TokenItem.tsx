import { Trans } from '@lingui/react/macro';

import { ClickableButton } from '@/components/ClickableButton.js';
import { TokenIcon } from '@/components/Tips/TokenIcon.js';
import { isZero, multipliedBy } from '@/helpers/number.js';
import type { Token } from '@/hooks/useCustomFungibleTokens.js';

interface TokenItemProps {
    token: Token;
    disableChainIcon?: boolean;
}

export function TokenItem({ token, disableChainIcon }: TokenItemProps) {
    const usdtValue = +multipliedBy(token.price, token.amount).toFixed(2);
    const usd =
        token.custom && isZero(usdtValue) ? (
            <Trans>Added</Trans>
        ) : Number.isNaN(usdtValue) || isZero(usdtValue) ? (
            ''
        ) : (
            `$${usdtValue}`
        );

    return (
        <ClickableButton
            key={token.id}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-bold text-lightMain"
            enablePropagate
        >
            <div className="flex items-center gap-x-2.5">
                <TokenIcon disableChainIcon={disableChainIcon} token={token} />
                <div className="text-left">
                    <span>{token.name}</span>
                    <br />
                    <span className="text-[13px] text-lightSecond">{`${token.balance} ${token.symbol}`}</span>
                </div>
            </div>
            <span>{usd}</span>
        </ClickableButton>
    );
}
