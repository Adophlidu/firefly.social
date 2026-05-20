'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Image } from '@/esm/Image.js';
import { resolveCategorySlugIcon } from '@/helpers/prediction/category/resolveCategorySlugIcon.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    item: PolymarketEventSlugListData;
    size?: number;
    className?: string;
}

export const PredictionCategorySlugIcon = memo<Props>(function PredictionCategorySlugIcon({
    item,
    size = 18,
    className,
}) {
    const isDarkMode = useIsDarkMode();
    const src = resolveCategorySlugIcon(item, isDarkMode);

    if (!src) return null;

    return (
        <Image
            src={src}
            alt=""
            width={size}
            height={size}
            className={classNames('shrink-0 rounded-sm object-contain', className)}
        />
    );
});
