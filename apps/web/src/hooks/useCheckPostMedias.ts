import { Source } from '@dimensiondev/enums';
import { t } from '@lingui/core/macro';
import { useCallback } from 'react';

import { SUPPORTED_VIDEO_SOURCES } from '@/constants/computed.js';
import { FileMimeType } from '@/constants/enum.js';
import { MAX_FILE_SIZE_PER_VIDEO } from '@/constants/limitation.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatFileSize } from '@/helpers/formatFileSize.js';
import { getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { getPostVideoSizeLimit } from '@/helpers/getPostLimitation.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function useCheckPostMedias() {
    const { availableSources, images, videos } = useCompositePost();
    const { type } = useComposeStateStore();
    const imageCount = images.length;
    return useCallback(() => {
        if (
            availableSources.some((source) => !SUPPORTED_VIDEO_SOURCES.includes(source)) &&
            videos.some((x) => x.file)
        ) {
            enqueueErrorMessage(t`Failed to upload. Video is not supported yet.`);
            return true;
        }

        if (availableSources.includes(Source.Twitter) && images.some((x) => x.mimeType === FileMimeType.WEBP)) {
            enqueueErrorMessage(t`Failed to upload. File type is not supported on X.`);
            return true;
        }

        const maxImageCount = getCurrentPostImageLimits(type, availableSources);
        if (imageCount > maxImageCount) {
            enqueueErrorMessage(t`Failed to upload. More than ${maxImageCount} images.`);
            return true;
        }

        const videoSizeLimit = getPostVideoSizeLimit(availableSources);
        if (videos.some((x) => x.file && x.file.size > videoSizeLimit)) {
            enqueueErrorMessage(
                t`Failed to upload on ${resolveSourcesName(
                    availableSources.filter((x) => MAX_FILE_SIZE_PER_VIDEO[x] === videoSizeLimit),
                )}. Video size exceeds ${formatFileSize(videoSizeLimit)}`,
            );
            return true;
        }

        return false;
    }, [availableSources, videos, images, type]);
}
