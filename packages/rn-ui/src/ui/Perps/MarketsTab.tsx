import { memo, useCallback, useState } from 'react';
import { XStack, YStack } from 'tamagui';

import { MarketsList } from '@/components/MarketsList';
import { OrderBook } from '@/components/OrderBook';
import { HyperliquidProvider } from '@/components/Providers/HyperliquidProvider';

import { AddFundsButton } from '../../components/AddFundsButton';
import { LiteTabs } from '../../components/LiteTabs';
import { SearchInput } from '../../components/SearchInput';
import { SortByFilter } from '../../components/SortByFilter';
import { WithdrawButton } from '../../components/WithdrawButton';
import { filterData, markets } from '../../mocks/markets';

interface MarketsTabProps {
    onMarketSelect: (market: string) => void;
    onKeywordChange?: (keyword: string) => void;
    onCategoryChange?: (category: string) => void;
    withdraw?: () => Promise<string>;
    addFunds?: () => Promise<string>;
}

export const MarketsTab = memo<MarketsTabProps>(function MarketsTab({
    onMarketSelect,
    onKeywordChange,
    onCategoryChange,
    withdraw,
    addFunds,
}) {
    const [keyword, setKeyword] = useState('');
    const [coin, setCoin] = useState('');
    const [category, setCategory] = useState(markets[0].value);
    const [sortBy, setSortBy] = useState(filterData[0].value);

    const handleKeywordChange = useCallback(
        (value: string) => {
            setKeyword(value);
            onKeywordChange?.(value);
        },
        [onKeywordChange],
    );
    const handleCategoryChange = useCallback(
        (value: string) => {
            setCategory(value);
            onCategoryChange?.(value);
        },
        [onCategoryChange],
    );
    const handleMarketSelect = useCallback(
        (market: string) => {
            setCoin(market);
            onMarketSelect(market);
        },
        [onMarketSelect],
    );

    return (
        <HyperliquidProvider>
            <YStack paddingHorizontal={16} gap={12}>
                <SearchInput value={keyword} onChange={handleKeywordChange} />
                <LiteTabs value={category} data={markets} onChange={handleCategoryChange} />
                <XStack justifyContent="flex-start">
                    <SortByFilter data={filterData} value={sortBy} onChange={setSortBy} />
                </XStack>
                <XStack gap={12}>
                    <WithdrawButton onPress={withdraw} />
                    <AddFundsButton onPress={addFunds} />
                </XStack>
                <OrderBook coin={coin} />
                <MarketsList onMarketSelect={handleMarketSelect} />
            </YStack>
        </HyperliquidProvider>
    );
});
