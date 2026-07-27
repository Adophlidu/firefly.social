'use client';

import { DARK_THEME, LIGHT_THEME } from '@dimensiondev/kline-core';
import { KlineChart } from '@dimensiondev/kline-core/react';
import { createHyperliquidDataFeed } from '@dimensiondev/kline-hyperliquid';
import { usePerpsClient } from '@dimensiondev/perps-react';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { memo, useMemo } from 'react';

import styles from '@/components/Perps/PerpsResponsive.module.css';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

interface Props {
    coin: string;
    displayCoin?: string;
}

export const PerpsChart = memo(function PerpsChart({ coin, displayCoin = coin }: Props) {
    const client = usePerpsClient();
    const isDarkMode = useIsDarkMode();
    const datafeed = useMemo(() => createHyperliquidDataFeed(client), [client]);
    const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

    return (
        <section
            data-testid="perps-chart"
            aria-label={t`${displayCoin} price chart`}
            className={classNames(
                styles.chart,
                'min-w-0 overflow-hidden border-b border-r border-line bg-primaryBottom text-main',
            )}
        >
            <KlineChart
                datafeed={datafeed}
                symbol={coin}
                interval="15m"
                theme={theme}
                toolbar
                drawingsToolbar
                persistDrawings
            />
        </section>
    );
});
