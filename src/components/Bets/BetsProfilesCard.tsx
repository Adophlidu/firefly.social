'use client';

import { useQuery } from '@tanstack/react-query';

import { BetsProfileCardUI } from '@/components/Bets/BetsProfileCardUI.js';
import { getBetsPortfolio } from '@/providers/firefly/bets/getBetsPortfolio.js';

interface BetsProfilesCardProps {
    address: string;
}

export function BetsProfilesCard({ address }: BetsProfilesCardProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['bets', 'profiles', address.toLowerCase()],
        staleTime: 1000 * 60 * 5,
        queryFn: () => getBetsPortfolio([address]),
    });

    if (isLoading) {
        return (
            <div className="flex animate-pulse justify-evenly gap-3 rounded-xl bg-primaryBottom p-3">
                <div className="flex flex-1 items-center gap-2 text-main">
                    <div className="size-8 shrink-0 rounded-full bg-third" />
                    <div className="flex h-9 flex-col justify-between">
                        <div className="h-4 w-[96px] shrink-0 rounded-[4px] bg-third" />
                        <div className="flex h-4 w-[64px] items-center rounded-[4px] bg-third" />
                    </div>
                </div>
                <div className="flex h-9 flex-1 flex-col items-end justify-between">
                    <div className="h-4 w-[64px] shrink-0 rounded-[4px] bg-third" />
                    <div className="ml-auto flex h-4 w-[128px] items-center rounded-[4px] bg-third" />
                </div>
                <div className="flex h-9 flex-1 flex-col items-end justify-between">
                    <div className="h-4 w-[64px] shrink-0 rounded-[4px] bg-third text-sm font-semibold" />
                    <div className="ml-auto flex h-4 w-[128px] items-center rounded-[4px] bg-third" />
                </div>
            </div>
        );
    }

    return data?.result?.map((profile) => (
        <BetsProfileCardUI key={`${profile.platform}-${profile.wallet}`} profile={profile} />
    ));
}
