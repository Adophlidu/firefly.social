import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PredictionPlatform } from '@/constants/enum.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { isZero } from '@/helpers/number.js';
import { openPredictionPage } from '@/helpers/openPredictionPage.js';
import { computeVolume, toFixedTrimmed } from '@/helpers/polymarket.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

export const BUTTON_COLORS = {
    success: {
        bg: 'bg-[#dcf1d9] dark:bg-[#284129]',
        text: 'text-success',
    },
    danger: {
        bg: 'bg-[#ffe6e4] dark:bg-[#502829]',
        text: 'text-danger',
    },
} as const;

interface ActivityRateProps {
    activity: BetsActivity;
}

export function PredictionActivityRate({ activity }: ActivityRateProps) {
    const { conditionOutcomes, conditionOutcomePrices } = activity;
    const totalPrice = conditionOutcomePrices.reduce(
        (sum, price) => (!Number.isNaN(+price) ? sum + Number(price) : sum),
        0,
    );
    const isZeroPrice = isZero(totalPrice);
    const firstOutcome = conditionOutcomes[0] || 'Yes';
    const secondOutcome = conditionOutcomes[1] || 'No';

    const computedOutcomes = useMemo(() => {
        return conditionOutcomes.map((outcome, index) => {
            const price = conditionOutcomePrices[index] || '0';
            const rate = totalPrice > 0 ? Number(price) / totalPrice : 0;
            const isLast = index === conditionOutcomes.length - 1;

            return {
                outcome,
                rate,
                isLast,
                price,
            };
        });
    }, [conditionOutcomes, conditionOutcomePrices, totalPrice]);

    return (
        <div className="mt-3">
            <div className="flex items-end justify-between gap-1">
                {computedOutcomes.map((outcomeData) => {
                    return (
                        <div
                            key={outcomeData.outcome}
                            className={classNames(
                                'flex min-w-0 flex-1 shrink-0 break-all text-sm',
                                outcomeData.isLast ? 'justify-end text-right text-danger' : 'text-left text-success',
                            )}
                        >
                            <span className={`min-w-0 truncate font-bold ${bedStead.className}`}>
                                {outcomeData.outcome}
                            </span>
                            <span className="ml-1 shrink-0 font-semibold">
                                {toFixedTrimmed(+outcomeData.price * 100, 2)}¢
                            </span>
                        </div>
                    );
                })}
            </div>
            {!isZeroPrice ? (
                <div className="flex items-center gap-1">
                    {computedOutcomes.map((outcomeData) => {
                        return (
                            <div
                                key={outcomeData.outcome}
                                className={classNames('h-1 min-w-2', outcomeData.isLast ? 'bg-danger' : 'bg-success')}
                                style={{
                                    flex: outcomeData.rate,
                                }}
                            />
                        );
                    })}
                </div>
            ) : null}
            {activity.platform === PredictionPlatform.Polymarket ? (
                <div className="mt-3 flex gap-2">
                    {firstOutcome ? (
                        <ClickableButton
                            className={classNames(
                                'flex-1 rounded-lg px-4 py-2 text-sm font-bold leading-6',
                                BUTTON_COLORS.success.bg,
                                BUTTON_COLORS.success.text,
                            )}
                            data-prevent-progress
                            onClick={() => {
                                if (activity.rawData?.slug) openPredictionPage(activity.rawData.slug, { outcome: 0 });
                            }}
                        >
                            <Trans>Buy {firstOutcome}</Trans>
                        </ClickableButton>
                    ) : null}
                    {secondOutcome ? (
                        <ClickableButton
                            className={classNames(
                                'flex-1 rounded-lg px-4 py-2 text-sm font-bold leading-6',
                                BUTTON_COLORS.danger.bg,
                                BUTTON_COLORS.danger.text,
                            )}
                            data-prevent-progress
                            onClick={() => {
                                if (activity.rawData?.slug) openPredictionPage(activity.rawData.slug, { outcome: 1 });
                            }}
                        >
                            <Trans>Buy {secondOutcome}</Trans>
                        </ClickableButton>
                    ) : null}
                </div>
            ) : null}
            <div className="mt-3 flex items-center justify-between">
                {conditionOutcomes.map((outcome, index) => {
                    const isLast = index === conditionOutcomes.length - 1;
                    return (
                        <div
                            key={outcome}
                            className={classNames('text-[13px] text-second', isLast ? 'text-right' : 'text-left')}
                        >
                            ${computeVolume(activity, index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
