import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { ClickableButton } from '@/components/ClickableButton.js';
import { bedStead } from '@/fonts/bedStead/index.js';
import { isZero } from '@/helpers/number.js';
import { computeVolume, toFixedTrimmed } from '@/helpers/polymarket.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

const BUTTON_COLORS = {
    success: {
        bg: 'bg-[#dcf1d9]',
        hover: 'hover:bg-[#284129]',
        text: 'text-success',
    },
    danger: {
        bg: 'bg-[#ffe6e4]',
        hover: 'hover:bg-[#502829]',
        text: 'text-danger',
    },
} as const;

interface ActivityRateProps {
    activity: BetsActivity;
}

export function BetsActivityRate({ activity }: ActivityRateProps) {
    const isZeroPrice = activity.conditionOutcomePrices.every((price) => isZero(price));
    const firstOutcome = activity.conditionOutcomes[0] || 'Yes';
    const secondOutcome = activity.conditionOutcomes[1] || 'No';

    return (
        <div className="mt-3">
            <div className="flex items-center gap-1">
                {activity.conditionOutcomes.map((outcome, index) => {
                    const price = activity.conditionOutcomePrices[index] || '0';
                    const rate = toFixedTrimmed(+price * 100, 2);
                    const isLast = index === activity.conditionOutcomes.length - 1;

                    return (
                        <div
                            key={outcome}
                            style={{
                                flex: isZeroPrice ? 1 : price,
                            }}
                            className={isLast ? 'text-right text-danger' : 'text-left text-success'}
                        >
                            <div className="w-full whitespace-nowrap text-sm">
                                <span className={`font-bold ${bedStead.className}`}>{outcome}</span>
                                <span className="ml-1 font-semibold">{rate}¢</span>
                            </div>
                            {isZeroPrice ? null : (
                                <div className={classNames('mt-1 h-1 w-full', isLast ? 'bg-danger' : 'bg-success')} />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 flex gap-2">
                {firstOutcome ? (
                    <ClickableButton
                        className={classNames(
                            'flex-1 rounded-lg px-4 py-2 text-sm font-bold leading-6',
                            BUTTON_COLORS.success.bg,
                            BUTTON_COLORS.success.hover,
                            BUTTON_COLORS.success.text,
                        )}
                        onClick={() => {
                            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
                                path: `/bets/${activity.eventSlug}?outcome=${firstOutcome}`,
                            });
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
                            BUTTON_COLORS.danger.hover,
                            BUTTON_COLORS.danger.text,
                        )}
                        onClick={() => {
                            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
                                path: `/bets/${activity.eventSlug}?outcome=${secondOutcome}`,
                            });
                        }}
                    >
                        <Trans>Buy {secondOutcome}</Trans>
                    </ClickableButton>
                ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between">
                {activity.conditionOutcomes.map((outcome, index) => {
                    const isLast = index === activity.conditionOutcomes.length - 1;
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
