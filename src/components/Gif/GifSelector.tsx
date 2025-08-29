import { Trans } from '@lingui/react/macro';
import { useCallback } from 'react';

import { GiphyGifSelector } from '@/components/Gif/GiphyGifSelector.js';
import { TenorGifSelector } from '@/components/Gif/TenorGifSelector.js';
import { Source } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatFileSize } from '@/helpers/formatFileSize.js';
import { getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { getPostGifSizeLimit } from '@/helpers/getPostLimitation.js';
import { createGifMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { IGif } from '@/types/giphy.js';

interface GifSelectorProps {
    onSelected: () => void;
}

export function GifSelector({ onSelected }: GifSelectorProps) {
    const { type, updateImages } = useComposeStateStore();
    const { availableSources } = useCompositePost();

    const maxImageCount = getCurrentPostImageLimits(type, availableSources);
    const maxGifSize = getPostGifSizeLimit(availableSources);
    const hasBsky = availableSources.includes(Source.Bsky);

    const onGifSelected = useCallback(
        (gif: IGif) => {
            const gifSize = gif.images.original.size;
            if (gifSize && parseFloat(gifSize) > maxGifSize) {
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

    return hasBsky ? <TenorGifSelector onSelected={onGifSelected} /> : <GiphyGifSelector onSelected={onGifSelected} />;
}
