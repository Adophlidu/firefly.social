'use client';

import type { PredictionPlatform } from '@dimensiondev/enums';
import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { classNames, formatPriceToCents } from '@dimensiondev/utils';
import { multipliedBy, safe } from '@dimensiondev/web3/numbers';
import { formatTokenItemAmount } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { waitForAuthorization } from '@/helpers/waitForPrivyAuthorization.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import type { PredictionOpenOrder } from '@/types/prediction.js';

interface OpenOrderItemProps {
    platform: PredictionPlatform;
    order: PredictionOpenOrder;
}

export const OpenOrderItem = memo<OpenOrderItemProps>(function OpenOrderItem({ order }) {
    const filled = safe(order.size_matched, 0).toString();
    const size = safe(order.original_size, 0).toString();
    const sharesText = `${formatTokenItemAmount(filled, 0)} / ${formatTokenItemAmount(size, 0, BigNumber.ROUND_CEIL)}`;
    const totalUsd = multipliedBy(safe(order.price, 0), safe(order.original_size, 0)).toNumber();
    const lowerSide = order.side.toLowerCase();
    const orderSide =
        lowerSide === 'buy' ? <Trans>Buy</Trans> : lowerSide === 'sell' ? <Trans>Sell</Trans> : order.side;

    const [{ loading }, cancelOrder] = useAsyncFn(async () => {
        if (!useFireflyWalletStore.getState().isAuthorized) {
            await waitForAuthorization();
        }
        iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_NAVIGATE, {
            path: urlcat('/bet/order/open', {
                orderId: order.id,
                proxyAddress: order.maker_address,
            }),
        });
        useGlobalState.getState().updateFireflyWalletIsOpen(true);
    }, [order.id, order.maker_address]);

    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line p-3 md:flex-row">
            <div className="flex w-full flex-1 items-center gap-1">
                <div className="flex min-w-0 flex-1 flex-col">
                    <span
                        className={classNames(
                            'w-full truncate text-sm font-semibold',
                            order.outcome_index === 1 ? 'text-danger' : 'text-success',
                        )}
                    >
                        {order.outcome}
                    </span>
                    <span className="text-xs text-second">{orderSide}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="w-full truncate text-sm font-semibold text-main">
                        {formatPriceToCents(order.price)}
                    </span>
                    <span className="text-xs text-second">
                        <Trans>Price</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="w-full truncate text-sm font-semibold text-main">{sharesText}</span>
                    <span className="text-xs text-second">
                        <Trans>Shares</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-end md:items-start">
                    <span className="w-full truncate text-sm font-semibold text-main">{formatTokenUSD(totalUsd)}</span>
                    <span className="text-xs text-second">
                        <Trans>Total</Trans>
                    </span>
                </div>
            </div>
            <ClickableButton
                className="h-8 w-full shrink-0 rounded-lg bg-bg px-4 text-xs font-semibold text-main md:w-auto md:min-w-20"
                loading={loading}
                onlyLoading
                onClick={cancelOrder}
            >
                <Trans>Cancel</Trans>
            </ClickableButton>
        </div>
    );
});
