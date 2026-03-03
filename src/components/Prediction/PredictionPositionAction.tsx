'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { type PredictionPositionDataForUI } from '@/types/prediction.js';

interface Props {
    position: PredictionPositionDataForUI;
}

const MIN_SELLABLE_SHARES = 0.01;

export const PredictionPositionAction = memo<Props>(function PredictionPositionAction({ position }) {
    const openFireflyWallet = useOpenFireflyWallet();

    return (
        <div className="flex flex-1 items-center justify-end empty:hidden">
            {position.isClaimable ? (
                position.isWin ? (
                    <ClickableButton
                        className="box-border h-8 w-full whitespace-nowrap rounded-lg bg-[#429F37] py-2 text-xs text-white md:w-[128px]"
                        onClick={() => {
                            // There is no such an API endpoint for querying a single position,
                            // so we need to pass the whole position object
                            openFireflyWallet({
                                path: urlcat('/bet/position', {
                                    position: JSON.stringify(position),
                                    action: 'claim-proceeds',
                                }),
                            });
                        }}
                    >
                        <Trans>Claim Proceed</Trans>
                    </ClickableButton>
                ) : (
                    <ClickableButton
                        className="box-border h-8 w-full whitespace-nowrap rounded-lg bg-[#ff564d] py-2 text-xs text-white md:w-[128px]"
                        onClick={async () => {
                            // There is no such an API endpoint for querying a single position,
                            // so we need to pass the whole position object
                            openFireflyWallet({
                                path: urlcat('/bet/position', {
                                    position: JSON.stringify(position),
                                    action: 'close-lost-position',
                                }),
                            });
                        }}
                    >
                        <Trans>Close lost position</Trans>
                    </ClickableButton>
                )
            ) : position.shares && position.shares >= MIN_SELLABLE_SHARES ? (
                <ClickableButton
                    className="box-border h-8 w-full whitespace-nowrap rounded-lg bg-highlight py-2 text-xs text-white md:w-[128px]"
                    onClick={() => {
                        const outcomeIndex = position.outcomeIndex ?? 0;
                        const params = new URLSearchParams();
                        params.set('side', 'sell');
                        params.set('outcome', String(outcomeIndex));
                        if (position.conditionId) params.set('conditionId', position.conditionId);
                        openFireflyWallet({
                            path: `/bet/event/${encodeURIComponent(position.marketSlug)}?${params.toString()}`,
                        });
                    }}
                >
                    <Trans>Sell</Trans>
                </ClickableButton>
            ) : null}
        </div>
    );
});
