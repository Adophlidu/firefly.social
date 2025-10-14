import { Trans } from '@lingui/react/macro';
import { useCallback } from 'react';

import { TenorGifSelector } from '@/components/Gif/TenorGifSelector.js';
import { Loading } from '@/components/Loading.js';
import { Source } from '@/constants/enum.js';
import { dynamic } from '@/esm/dynamic.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatFileSize } from '@/helpers/formatFileSize.js';
import { getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { getPostGifSizeLimit } from '@/helpers/getPostLimitation.js';
import { createGifMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { IGif } from '@/types/giphy.js';

const DynamicGiphyGifSelector = dynamic(
    () => import('@/components/Gif/GiphyGifSelector.js').then(async (mod) => mod.GiphyGifSelector),
    { ssr: false, loading: () => <Loading /> },
);

interface GifSelectorProps {
    onSelected: () => void;
}

export function GifSelector({ onSelected }: GifSelectorProps) {
    const { type, updateImages } = useComposeStateStore();
    const { availableSources } = useCompositePost();

    const maxImageCount = getCurrentPostImageLimits(type, availableSources);
    const maxGifSize = getPostGifSizeLimit(availableSources);

    const onGifSelected = useCallback(
        (gif: IGif) => {
            const gifSize = gif.images.original.size;
            if (gifSize && Number.parseFloat(gifSize) > maxGifSize) {
                enqueueErrorMessage(<Trans>Failed to upload. Gif size exceeds {formatFileSize(maxGifSize)}</Trans>);
                return;
            }
            updateImages((images) => {
                if (images.length === maxImageCount) return images;
                return [...images, createGifMediaObject(gif)].slice(0, maxImageCount);
            });
            onSelected();
        },
        [maxImageCount, maxGifSize, onSelected, updateImages],
    );

    if (availableSources.includes(Source.Bsky)) return <TenorGifSelector onSelected={onGifSelected} />;
    return <DynamicGiphyGifSelector onSelected={onGifSelected} />;
}
