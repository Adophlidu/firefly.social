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
    const usd = Number.isNaN(usdtValue) || isZero(usdtValue) ? '' : `$${usdtValue}`;

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
                    {token.custom ? (
                        <span className="ml-2.5 inline-block h-5 rounded bg-lightBg px-2 text-xs font-medium leading-5 text-second">
                            <Trans>Added</Trans>
                        </span>
                    ) : null}
                    <br />
                    <span className="text-[13px] text-second">{token.symbol || '-'}</span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span>{usd || '-'}</span>
                <span className="text-[13px] text-second">{token.balance || '0'}</span>
            </div>
        </ClickableButton>
    );
}
