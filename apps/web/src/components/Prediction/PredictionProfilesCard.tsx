'use client';

import { isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { skipToken, useQuery } from '@tanstack/react-query';

import { PredictionProfileCardUI } from '@/components/Prediction/PredictionProfileCardUI.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getPredictionPortfolio } from '@/providers/firefly/prediction/getPredictionPortfolio.js';

interface PredictionProfilesCardProps {
    address: string;
}

export function PredictionProfilesCard({ address }: PredictionProfilesCardProps) {
    const isEvmAddress = isValidAddressEthereum(address);
    const { data, isLoading } = useQuery({
        queryKey: ['bets', 'profiles', address.toLowerCase()],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: isEvmAddress ? () => getPredictionPortfolio([address]) : skipToken,
    });

    if (!isEvmAddress) return null;

    const resultLength = data?.result?.length || 0;
    const height = isLoading ? 60 : Math.max(resultLength * 60 + (resultLength - 1) * 12, 0);

    return (
        <div
            className="space-y-3 transition-all duration-200 ease-in-out"
            style={{
                minHeight: height,
            }}
        >
            {isLoading ? (
                <div className="flex animate-pulse justify-evenly gap-3 rounded-xl bg-primaryBottom p-3">
                    <div className="flex flex-1 items-center gap-2 text-main">
                        <div className="size-8 shrink-0 rounded-full bg-third" />
                        <div className="flex h-9 flex-1 flex-col justify-between">
                            <div className="h-4 w-full max-w-[96px] shrink-0 rounded-[4px] bg-third" />
                            <div className="flex h-4 w-1/2 max-w-[64px] items-center rounded-[4px] bg-third" />
                        </div>
                    </div>
                    <div className="flex h-9 flex-1 flex-col items-end justify-between">
                        <div className="h-4 w-1/2 max-w-[64px] shrink-0 rounded-[4px] bg-third" />
                        <div className="ml-auto flex h-4 w-full max-w-[128px] items-center rounded-[4px] bg-third" />
                    </div>
                    <div className="flex h-9 flex-1 flex-col items-end justify-between">
                        <div className="h-4 w-1/2 max-w-[64px] shrink-0 rounded-[4px] bg-third text-sm font-semibold" />
                        <div className="ml-auto flex h-4 w-full max-w-[128px] items-center rounded-[4px] bg-third" />
                    </div>
                </div>
            ) : (
                data?.result?.map((profile) => (
                    <PredictionProfileCardUI key={`${profile.platform}-${profile.wallet}`} profile={profile} />
                ))
            )}
        </div>
    );
}
