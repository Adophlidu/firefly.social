import { useCallback } from 'react';

import { type SocialSource } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { isValidPostImage } from '@/helpers/validatePostFile.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { type ComposeType } from '@/types/compose.js';

export function useUpdateImages() {
    const { updateImages } = useComposeStateStore();
    return useCallback(
        (files: File[], availableSources: SocialSource[], composeType: ComposeType) => {
            const maxImageCount = getCurrentPostImageLimits(composeType, availableSources);
            const validFiles = [...files].filter((file) => {
                const message = isValidPostImage(availableSources, file);
                if (message) {
                    enqueueErrorMessage(message);
                    return false;
                }
                return true;
            });
            updateImages((images) => {
                if (images.length === maxImageCount) return images;
                return [...images, ...validFiles.map((file) => createLocalMediaObject(file))].slice(0, maxImageCount);
            });
        },
        [updateImages],
    );
}
