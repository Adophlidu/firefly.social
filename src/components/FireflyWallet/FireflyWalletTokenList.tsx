import { Trans } from '@lingui/react/macro';

import LineArrowUp from '@/assets/line-arrow-up.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { useExpandableTokens } from '@/components/SendTransactionModal/SelectTokenModal.js';
import { TokenItem } from '@/components/Tips/TokenItem.js';
import type { Token } from '@/hooks/useCustomFungibleTokens.js';

interface Props {
    tokens: Token[];
    isLoading?: boolean;
    onClickToken?: (token: Token) => void;
}

export function FireflyWalletTokenList({ tokens, isLoading, onClickToken }: Props) {
    const { tokens: data, setShowSmall, canExpand, showSmall } = useExpandableTokens(tokens);

    if (isLoading) {
        return <Loading />;
    }

    if (!tokens.length) {
        return (
            <div className="px-3 py-2">
                <NoResultsFallback className="mt-20" />
            </div>
        );
    }

    return (
        <div className="w-full space-y-2 pt-2">
            {data.map((token) => (
                <TokenItem
                    onClick={() => onClickToken?.(token)}
                    token={token}
                    key={token.id}
                    className="duration-100 hover:bg-bg"
                />
            ))}
            {canExpand ? (
                <ClickableButton
                    className="mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold text-highlight hover:bg-lightBg"
                    onClick={() => setShowSmall((prev) => !prev)}
                >
                    <span>
                        {showSmall ? <Trans>Hide assets &lt; 1 USD</Trans> : <Trans>Show assets &lt; 1 USD</Trans>}
                    </span>
                    <LineArrowUp width={20} height={20} className={showSmall ? '' : 'rotate-180'} />
                </ClickableButton>
            ) : null}
        </div>
    );
}
