import ChartIcon from '@dimensiondev/assets/chart.svg';
import { classNames } from '@dimensiondev/utils';
import { memo, use } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { CryptoIconButton } from '@/components/Prediction/PredictionSeries/CryptoIconButton.js';
import { PredictionChartType } from '@/constants/bets.js';
import { capturePolymarketEventChartChange } from '@/providers/telemetry/capturePolymarketEvent.js';

export const ToggleChartTypeButtons = memo(function ToggleChartTypeButtons() {
    const { chartType, event, setChartType } = use(PredictionContext);

    const crypto = event?.cryptoData?.name;
    const eventSlug = event?.slug;
    if (!crypto || event.markets.length !== 1) return null;

    return (
        <div className="flex shrink-0 items-center gap-1">
            <ClickableButton
                onClick={() => {
                    if (eventSlug)
                        capturePolymarketEventChartChange(eventSlug, 'chart_type', { chart_type: 'ratio_line' });
                    setChartType(PredictionChartType.RatioLine);
                }}
                className={classNames(
                    'flex size-[30px] items-center justify-center rounded-md hover:bg-highlight/10 hover:text-highlight',
                    chartType === PredictionChartType.RatioLine ? 'bg-highlight/10 text-highlight' : 'text-second',
                )}
            >
                <ChartIcon />
            </ClickableButton>
            <CryptoIconButton
                crypto={crypto}
                selected={chartType === PredictionChartType.PriceLine}
                onClick={() => {
                    if (eventSlug)
                        capturePolymarketEventChartChange(eventSlug, 'chart_type', { chart_type: 'price_line' });
                    setChartType(PredictionChartType.PriceLine);
                }}
            />
        </div>
    );
});
