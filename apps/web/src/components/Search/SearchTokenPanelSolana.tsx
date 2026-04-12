'use client';

import LineArrowUp from '@dimensiondev/assets/line-arrow-up.svg';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SearchContentPanel } from '@/components/Search/SearchContentPanel.js';
import { TokenItem } from '@/components/Tips/TokenItem.js';
import { isGreaterThan, isLessThan } from '@/helpers/number.js';
import { useSolanaTokens } from '@/hooks/useSolanaTokens.js';
import type { Token } from '@/providers/types/Transfer.js';

interface SearchSolanaTokenPanelProps {
    address: string;
    onSelected?: (selected: Token) => void;
    isSelected?: (item: Token) => boolean;
}

function getTokenItem(token: Token) {
    return <TokenItem key={token.id} token={token} disableChainIcon />;
}

export const SearchTokenPanelSolana = memo<SearchSolanaTokenPanelProps>(function SearchSolanaTokenPanelSolana({
    address,
    onSelected,
    isSelected,
}) {
    const [showSmall, setShowSmall] = useState(false);
    const [showMore, setShowMore] = useState(false);

    const { data: tokens, isLoading } = useSolanaTokens(address);

    const [keyword, setKeyword] = useState('');
    const filteredTokens = useMemo(() => {
        const result = (tokens || []).filter((token) =>
            [token.name, token.symbol, token.id].some((value) => value.toLowerCase().includes(keyword.toLowerCase())),
        );
        const canExpand =
            result.some((token) => isGreaterThan(token.usdValue, 1)) &&
            result.some((token) => isLessThan(token.usdValue, 1));
        setShowMore(canExpand);

        return showSmall || !canExpand ? result : result.filter((token) => isGreaterThan(token.usdValue, 1));
    }, [tokens, showSmall, keyword]);

    return (
        <SearchContentPanel<Token, unknown>
            isLoading={isLoading}
            placeholder={t`Search token`}
            showFilter={false}
            keyword={keyword}
            onSearch={setKeyword}
            data={filteredTokens}
            itemRenderer={(token) => getTokenItem(token)}
            onSelected={onSelected}
            listKey={(token) => token.id}
            isSelected={isSelected}
        >
            {showMore ? (
                <ClickableButton
                    className="text-highlight hover:bg-lightBg mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold"
                    onClick={() => setShowSmall((prev) => !prev)}
                >
                    <span>
                        {showSmall ? (
                            <Trans>Hide tokens with small balances</Trans>
                        ) : (
                            <Trans>Show more tokens with small balances</Trans>
                        )}
                    </span>
                    <LineArrowUp width={20} height={20} className={showSmall ? '' : 'rotate-180'} />
                </ClickableButton>
            ) : null}
        </SearchContentPanel>
    );
});
