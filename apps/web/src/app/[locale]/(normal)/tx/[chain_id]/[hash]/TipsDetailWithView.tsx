'use client';

import { useSearchParams } from 'next/navigation.js';

import { TipsDetail } from '@/components/Tips/TipsDetail.js';
import { TipsDetailViewType } from '@/constants/enum.js';
import { type TipsDetail as TipsDetailType } from '@/providers/types/Firefly.js';

interface TipsDetailWithViewProps {
    tipsData: TipsDetailType;
}

export function TipsDetailWithView({ tipsData }: TipsDetailWithViewProps) {
    const searchParams = useSearchParams();
    const view = (searchParams.get('view') as TipsDetailViewType) ?? TipsDetailViewType.Sender;

    return <TipsDetail tipsData={tipsData} view={view} />;
}
