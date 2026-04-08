import { memo, useEffect, useMemo, useState } from 'react';
import { ScrollView, YStack } from 'tamagui';

import { OrderBook } from '@/components/OrderBook';
import { PerpsDetailTopBar } from '@/components/PerpsDetailTopBar';
import { PerpsKlinePlaceholder } from '@/components/PerpsKlinePlaceholder';
import { PerpsTickerSummary } from '@/components/PerpsTickerSummary';
import { PerpsTradeActionBar } from '@/components/PerpsTradeActionBar';
import { HyperliquidProvider } from '@/components/Providers/HyperliquidProvider';
import { loadPerpsDetailPage } from '@/services/perpsDetail';
import { PerpsDetailSkeleton } from '@/skeletons/PerpsDetailSkeleton';
import { type FetchPerpsDetailPage } from '@/types/services';
import { type PerpsDetailPageData } from '@/types/ui';

export interface PerpsMarketDetailProps {
    market?: string;
    coin: string;
    fetchPerpsDetailPage?: FetchPerpsDetailPage;
}

export const PerpsMarketDetail = memo<PerpsMarketDetailProps>(function PerpsMarketDetail({
    market = 'TEST',
    coin,
    fetchPerpsDetailPage,
}) {
    const [loading, setLoading] = useState(true);
    const [pageData, setPageData] = useState<PerpsDetailPageData | null>(null);

    const loadData = useMemo(() => {
        return fetchPerpsDetailPage ?? loadPerpsDetailPage;
    }, [fetchPerpsDetailPage]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);

            try {
                const response = await loadData({ market });
                if (!cancelled) {
                    setPageData(response.data);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [loadData, market]);

    if (loading || !pageData) {
        return <PerpsDetailSkeleton />;
    }

    return (
        <YStack height="100%" minHeight={0} backgroundColor="#FFFFFF">
            <YStack paddingTop={2}>
                <PerpsDetailTopBar
                    symbol={pageData.ticker.symbol}
                    leverage={pageData.ticker.leverage}
                    marketType={pageData.ticker.marketType}
                />
            </YStack>

            <ScrollView flex={1} minHeight={0} showsVerticalScrollIndicator={false}>
                <YStack paddingHorizontal={12} paddingTop={6} paddingBottom={8} gap={14}>
                    <PerpsTickerSummary ticker={pageData.ticker} />
                    <PerpsKlinePlaceholder />
                    <HyperliquidProvider>
                        <OrderBook
                            coin={coin}
                            buyLabel={pageData.orderBook.buyLabel}
                            sellLabel={pageData.orderBook.sellLabel}
                            unitLabel={pageData.orderBook.unitLabel}
                            rows={12}
                        />
                    </HyperliquidProvider>
                </YStack>
            </ScrollView>

            <YStack paddingHorizontal={12} paddingTop={8} paddingBottom={12}>
                <PerpsTradeActionBar actions={pageData.actions} />
            </YStack>
        </YStack>
    );
});
