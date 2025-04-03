import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { uniq } from 'lodash-es';
import { memo, useCallback, useMemo, useState } from 'react';

import LineArrowUp from '@/assets/line-arrow-up.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { SearchContentPanel } from '@/components/Search/SearchContentPanel.js';
import { TokenItem } from '@/components/Tips/TokenItem.js';
import { chains } from '@/configs/wagmiClient.js';
import { isGreaterThan, isLessThan } from '@/helpers/number.js';
import { type Token, useCustomFungibleTokens } from '@/hooks/useCustomFungibleTokens.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useTipsTokens } from '@/hooks/useTipsTokens.js';

interface SearchTokenPanelProps {
    address: string;
    onSelected?: (selected: Token) => void;
    isSelected?: (item: Token) => boolean;
}

function getTokenItem(token: Token) {
    return <TokenItem key={token.id} token={token} />;
}

export const SearchTokenPanelEVM = memo<SearchTokenPanelProps>(function SearchTokenPanel({
    address,
    onSelected,
    isSelected,
}) {
    const [showSmall, setShowSmall] = useState(false);
    const isMedium = useIsMedium('max');
    const { tokens, isLoading } = useTipsTokens(address);
    const chainIds = uniq(tokens.map((token) => token.chainId));

    const getChainItem = useCallback(
        (chainId: number, isTag?: boolean) => {
            const chain = chains.find((chain) => chain.id === chainId);

            return (
                <div className="flex items-center gap-2">
                    {chain ? (
                        <>
                            <ChainIcon chainId={chainId} size={15} />
                            {isMedium && isTag ? null : <span>{chain.name}</span>}
                        </>
                    ) : (
                        `${chainId}`
                    )}
                </div>
            );
        },
        [isMedium],
    );

    const [chainId, setChainId] = useState<number>();
    const [keyword, setKeyword] = useState('');
    const customTokens = useCustomFungibleTokens(chainId);

    const filteredTokens: Token[] = useMemo(() => {
        const kw = keyword.toLocaleLowerCase();
        return customTokens.concat(
            tokens.filter((token) => {
                return (
                    [token.name, token.symbol, token.id].some((value) => value.toLowerCase().includes(kw)) &&
                    (!chainId || token.chainId === chainId)
                );
            }),
        );
    }, [chainId, keyword, tokens, customTokens]);
    const canExpand = useMemo(() => {
        return (
            filteredTokens.some((token) => isGreaterThan(token.usdValue, 1)) &&
            filteredTokens.some((token) => isLessThan(token.usdValue, 1))
        );
    }, [filteredTokens]);

    const data =
        showSmall || !canExpand
            ? filteredTokens
            : filteredTokens.filter((token) => (token.custom ? true : isGreaterThan(token.usdValue, 1)));

    return (
        <SearchContentPanel<Token, number>
            isLoading={isLoading}
            placeholder={t`Search by name or symbol`}
            filterProps={{
                placeholder: t`All chains`,
                data: chainIds,
                popoverClassName: 'w-[150px]',
                itemRenderer: (chainId, isTag) => getChainItem(chainId, isTag),
                isSelected: (item, current) => item === current,
                selected: chainId,
                onSelected: setChainId,
            }}
            keyword={keyword}
            onSearch={setKeyword}
            data={data}
            itemRenderer={getTokenItem}
            onSelected={onSelected}
            listKey={(token) => token.id}
            isSelected={isSelected}
        >
            {canExpand ? (
                <ClickableButton
                    className="mt-2 flex w-full items-center justify-center gap-0.5 rounded-lg py-2 text-sm font-bold text-highlight hover:bg-lightBg"
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
