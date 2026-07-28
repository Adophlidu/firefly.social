'use client';

import { TipsDetailViewType } from '@dimensiondev/enums';

import { TipsDetail } from '@/components/Tips/TipsDetail.js';
import { useSearchParams } from '@/esm/navigation.js';
import type { TipsDetail as TipsDetailType } from '@/providers/types/Firefly.js';

interface TipsDetailWithViewProps {
    tipsData: TipsDetailType;
}

export function TipsDetailWithView({ tipsData }: TipsDetailWithViewProps) {
    const searchParams = useSearchParams();
    const view = (searchParams.get('view') as TipsDetailViewType) ?? TipsDetailViewType.Sender;

    return <TipsDetail tipsData={tipsData} view={view} />;
}
