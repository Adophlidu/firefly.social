import ChartIcon from '@dimensiondev/assets/chart.svg';
import { classNames } from '@dimensiondev/utils';
import { memo, use } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { CryptoIconButton } from '@/components/Prediction/PredictionSeries/CryptoIconButton.js';
import { PredictionChartType } from '@/constants/bets.js';

export const ToggleChartTypeButtons = memo(function ToggleChartTypeButtons() {
    const { chartType, event, setChartType } = use(PredictionContext);

    const crypto = event?.cryptoData?.name;
    if (!crypto || event.markets.length !== 1) return null;

    return (
        <div className="flex shrink-0 items-center gap-1">
            <ClickableButton
                onClick={() => setChartType(PredictionChartType.RatioLine)}
                className={classNames(
                    'hover:text-highlight hover:bg-highlight/10 flex size-[30px] items-center justify-center rounded-md',
                    chartType === PredictionChartType.RatioLine ? 'text-highlight bg-highlight/10' : 'text-second',
                )}
            >
                <ChartIcon />
            </ClickableButton>
            <CryptoIconButton
                crypto={crypto}
                selected={chartType === PredictionChartType.PriceLine}
                onClick={() => setChartType(PredictionChartType.PriceLine)}
            />
        </div>
    );
});
