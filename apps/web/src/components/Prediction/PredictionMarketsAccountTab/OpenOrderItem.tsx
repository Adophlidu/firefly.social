'use client';

import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { classNames } from '@dimensiondev/utils';
import { multipliedBy } from '@dimensiondev/web3/numbers';
import { Trans } from '@lingui/react/macro';
import { BigNumber } from 'bignumber.js';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { formatTokenItemAmount } from '@/components/Tips/formatTokenItemAmount.js';
import { waitForAuthorization } from '@/connectors/PrivyConnector.js';
import type { PredictionPlatform } from '@/constants/enum.js';
import { formatPriceToCents } from '@/helpers/formatPriceToCents.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { useGlobalState } from '@/store/useGlobalStore.js';
import type { PredictionOpenOrder } from '@/types/prediction.js';

interface OpenOrderItemProps {
    platform: PredictionPlatform;
    order: PredictionOpenOrder;
}

function safeBigNumber(value: BigNumber.Value, fallback: BigNumber.Value) {
    const n = BigNumber(value ?? 0);
    if (!n.isFinite()) return BigNumber(fallback);
    return n;
}

export const OpenOrderItem = memo<OpenOrderItemProps>(function OpenOrderItem({ order }) {
    const filled = safeBigNumber(order.size_matched, 0).toString();
    const size = safeBigNumber(order.original_size, 0).toString();
    const sharesText = `${formatTokenItemAmount(filled, 0)} / ${formatTokenItemAmount(size, 0, BigNumber.ROUND_CEIL)}`;
    const totalUsd = multipliedBy(safeBigNumber(order.price, 0), safeBigNumber(order.original_size, 0)).toNumber();
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
        <div className="border-line flex flex-col items-center gap-3 rounded-xl border p-3 md:flex-row">
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
                    <span className="text-second text-xs">{orderSide}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-main w-full truncate text-sm font-semibold">
                        {formatPriceToCents(order.price)}
                    </span>
                    <span className="text-second text-xs">
                        <Trans>Price</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-main w-full truncate text-sm font-semibold">{sharesText}</span>
                    <span className="text-second text-xs">
                        <Trans>Shares</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-end md:items-start">
                    <span className="text-main w-full truncate text-sm font-semibold">{formatTokenUSD(totalUsd)}</span>
                    <span className="text-second text-xs">
                        <Trans>Total</Trans>
                    </span>
                </div>
            </div>
            <ClickableButton
                className="bg-bg text-main h-8 w-full shrink-0 rounded-lg px-4 text-xs font-semibold md:w-auto md:min-w-20"
                loading={loading}
                onlyLoading
                onClick={cancelOrder}
            >
                <Trans>Cancel</Trans>
            </ClickableButton>
        </div>
    );
});
