import { produce } from 'immer';
import { compact } from 'lodash-es';
import { useCallback } from 'react';

import type { SocialSource } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getCurrentPostVideoLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { getVideoMetadata } from '@/helpers/getVideoMetadata.js';
import { createVideoMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { isValidPostVideo } from '@/helpers/validatePostFile.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function useUpdateVideos() {
    const { updateVideos } = useComposeStateStore();
    return useCallback(
        async (files: File[], availableSources: SocialSource[]) => {
            const maxVideoCount = getCurrentPostVideoLimits(availableSources);
            const promises = [...files].map(async (file) => {
                const message = await isValidPostVideo(availableSources, file);
                if (message) {
                    enqueueErrorMessage(message);
                    return null;
                }
                return file;
            });
            const validFiles = compact(await Promise.all(promises));
            // Add to post immediately.
            updateVideos((videos) => {
                if (videos.length === maxVideoCount) return videos;
                return [...videos, ...validFiles.map((file) => createVideoMediaObject(file))].slice(0, maxVideoCount);
            });
            // Once metadata is available update the video
            await Promise.allSettled(
                validFiles.map(async (file) => {
                    const metadata = await getVideoMetadata(file);
                    updateVideos((videos) => {
                        return produce(videos, (draft) => {
                            const video = draft.find((x) => x.file === file);
                            if (video) return draft.map((x) => (x.file === file ? { ...x, ...metadata } : x));
                            return draft;
                        });
                    });
                }),
            );
        },
        [updateVideos],
    );
}
