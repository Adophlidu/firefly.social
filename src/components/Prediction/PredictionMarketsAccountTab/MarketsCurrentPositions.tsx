'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { memo, useMemo, useState } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { getPredictionPositionList } from '@/components/Prediction/getPredictionPositionList.js';
import {
    type PolymarketWallet,
    WalletsFilter,
} from '@/components/Prediction/PredictionMarketsAccountTab/WalletsFilter.js';
import { PredictionPositionAction } from '@/components/Prediction/PredictionPositionAction.js';
import { PredictionPositionItem } from '@/components/Prediction/PredictionPositionItem.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { removeTrailingZeros } from '@/helpers/formatMarketCap.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { type BetsMarketDataForUI, type PredictionPositionDataForUI } from '@/types/prediction.js';

interface Props {
    markets: BetsMarketDataForUI[];
    platform: PredictionPlatform;
    wallets: Array<{
        wallet: string;
        proxy: string;
    }>;
    eventId: string;
}
interface PositionItemProps {
    position: PredictionPositionDataForUI;
    platform: PredictionPlatform;
}

function formatBetsPrice(price: number) {
    return removeTrailingZeros((price * 100).toFixed(2)) + '¢';
}

function PositionItemForSingleMarket({ position, platform }: PositionItemProps) {
    return (
        <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-line p-3 md:flex-row">
            <div className="flex w-full min-w-0 flex-1 items-center justify-evenly gap-2">
                <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start gap-1 truncate">
                    <span
                        className={classNames(
                            'flex h-[22px] items-center rounded px-1.5 py-1 text-sm font-semibold',
                            position.outcomeIndex === 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                        )}
                    >
                        {position.vote_status} {formatBetsPrice(position.cur_price)}
                    </span>
                    <span className="text-[11px] text-second">
                        <Trans>{formatPolymarketNumber(position.shares, { symbol: null })} shares</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start gap-1 truncate">
                    <span className="text-sm font-medium text-main">{formatBetsPrice(position.cur_price)}</span>
                    <span className="text-[11px] text-second">
                        <Trans>Current</Trans>
                    </span>
                </div>
                <div className="flex min-w-0 flex-1 shrink-0 flex-col items-start justify-center gap-1 truncate">
                    <span className="text-sm font-medium leading-[21px] tracking-[0.15px] text-main">
                        {formatPolymarketNumber(position.total_buy)}
                    </span>
                    <span
                        className={classNames('text-xs font-medium', position.pnl < 0 ? 'text-danger' : 'text-success')}
                    >
                        {formatPolymarketNumber(position.pnl, { sign: true })}
                        {`(${removeTrailingZeros((Math.abs(position.pnl_rate) * 100).toFixed(2))}%)`}
                    </span>
                </div>
            </div>
            {platform === PredictionPlatform.Polymarket ? (
                <div className="w-full shrink-0 md:w-auto">
                    <PredictionPositionAction position={position} />
                </div>
            ) : null}
        </div>
    );
}

export const MarketsCurrentPositions = memo<Props>(function MarketsCurrentPositions({
    markets,
    platform,
    wallets,
    eventId,
}) {
    const { wallets: fireflyWallets } = useFireflyWalletStore();
    const betAccounts = useMemo<PolymarketWallet[]>(
        () =>
            wallets.map((w) => {
                const isFireflyWallet = fireflyWallets.ethereum.some((x) => isSameEthereumAddress(x.address, w.wallet));
                return {
                    ...w,
                    isFireflyWallet,
                    label: isFireflyWallet ? <Trans>Firefly Wallet</Trans> : formatAddressEthereum(w.proxy, 4),
                };
            }),
        [wallets, fireflyWallets.ethereum],
    );
    const [selectedWallet, setSelectedWallet] = useState(first(betAccounts));

    const proxyAddress = selectedWallet?.proxy || '';
    const { data, isLoading } = useQuery({
        queryKey: [Source.Prediction, 'user-current-positions', platform, eventId, proxyAddress.toLowerCase()],
        enabled: !!proxyAddress,
        queryFn: () =>
            getPredictionPositionList(platform, {
                address: proxyAddress,
                eventId,
                isProxyAddress: true,
            }),
        select: (result) => result?.data?.filter((position) => position.shares >= 0.01),
    });

    const isSingleMarket = markets.length === 1;

    return (
        <div className="px-4 pt-4">
            <WalletsFilter wallets={betAccounts} currentWallet={selectedWallet} onChange={setSelectedWallet} />
            {isLoading ? (
                <Loading />
            ) : data?.length ? (
                <div className="space-y-4">
                    {data?.map((position, i) =>
                        isSingleMarket ? (
                            <PositionItemForSingleMarket
                                key={`${position.conditionId}-${i}`}
                                position={position}
                                platform={platform}
                            />
                        ) : (
                            <PredictionPositionItem
                                key={`${position.conditionId}-${i}`}
                                positionData={position}
                                platform={platform}
                                showAction={
                                    platform === PredictionPlatform.Polymarket && selectedWallet?.isFireflyWallet
                                }
                            />
                        ),
                    )}
                </div>
            ) : (
                <NoResultsFallback message={<Trans>No positions found.</Trans>} />
            )}
        </div>
    );
});
