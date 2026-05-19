import {
    ENABLED_RP_SOURCES,
    ENABLED_SCHEDULE_POST_SOURCES,
    GIF_MEDIA_SOURCE_CONFIG,
    SORTED_POLL_SOURCES,
    SORTED_SOCIAL_SOURCES,
} from '@dimensiondev/constants/computed';
import { FileMimeType } from '@dimensiondev/enums';
import { PopoverPanel } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { uniq } from 'lodash-es';
import { useMemo } from 'react';

import { PostByAnonymous } from '@/components/Compose/PostByAnonymous.js';
import { PostByItem } from '@/components/Compose/PostByItem.js';
import { ensureGifSource } from '@/helpers/checkPostGif.js';
import { getCurrentPostGifLimits, getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { validateVideoDuration } from '@/helpers/validateVideo.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { postFeatures } from '@/settings/post.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function PostBy() {
    const { poll, availableSources, images, rpPayload, videos } = useCompositePost();
    const { type, sealedSource, disabledSources } = useComposeStateStore();
    const { scheduleTime } = useComposeScheduleStateStore();

    const postByDisabled = useMemo(() => {
        return SORTED_SOCIAL_SOURCES.map((source) => {
            if (disabledSources?.includes(source)) {
                return {
                    disabled: true,
                };
            }
            if (
                type !== 'compose' &&
                type !== 'quote' &&
                sealedSource &&
                postFeatures.anonymousPost(sealedSource) &&
                sealedSource !== source
            ) {
                return {
                    disabled: true,
                };
            }

            if (poll && !SORTED_POLL_SOURCES.includes(source))
                return {
                    disabled: true,
                    reason: t`Polls are only available on ${resolveSourcesName(SORTED_POLL_SOURCES, undefined, true)}`,
                };

            if (scheduleTime && !ENABLED_SCHEDULE_POST_SOURCES.includes(source))
                return {
                    disabled: true,
                    reason: t`Scheduled posts are only available on ${resolveSourcesName(ENABLED_SCHEDULE_POST_SOURCES, undefined, true)}`,
                };

            const sources = uniq([...availableSources, source]);
            const maxImageCount = getCurrentPostImageLimits(type, sources);
            if (images.length > maxImageCount)
                return {
                    disabled: true,
                    reason: t`Image count limit reached`,
                };

            const maxGifCount = getCurrentPostGifLimits(sources);
            if (images.filter((x) => x.file.type === FileMimeType.GIF).length > maxGifCount)
                return {
                    disabled: true,
                    reason: t`GIF count limit reached`,
                };

            if (!ensureGifSource(images, source))
                return {
                    disabled: true,
                    reason: t`GIF source not supported. Supported sources: ${GIF_MEDIA_SOURCE_CONFIG[source].join(', ')}`,
                };

            if (!ENABLED_RP_SOURCES.includes(source) && rpPayload) {
                return {
                    disabled: true,
                    reason: t`Lucky drop is only available on ${resolveSourcesName(ENABLED_RP_SOURCES)}`,
                };
            }

            const hasInvalidVideo = videos.some((video) => {
                if (!video.width || !video.height || !video.duration) return false;
                const metadata = { width: video.width, height: video.height, duration: video.duration };
                return !validateVideoDuration(sources, metadata).isValid;
            });
            if (hasInvalidVideo) {
                return {
                    disabled: true,
                    reason: t`Video duration limit reached`,
                };
            }

            return { disabled: false };
        });
    }, [type, sealedSource, poll, scheduleTime, availableSources, images, rpPayload, videos, disabledSources]);

    const content = (
        <div className="no-scrollbar bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom flex max-h-[156px] flex-col gap-2 overflow-y-auto rounded-lg py-3 md:max-h-[188px] dark:border dark:shadow-none">
            {SORTED_SOCIAL_SOURCES.map((source, index) => (
                <PostByItem key={source} source={source} {...postByDisabled[index]} />
            ))}
            {postFeatures.anonymousPost(sealedSource) ? <PostByAnonymous /> : null}
        </div>
    );

    const isMedium = useIsMedium();

    if (isMedium)
        return (
            <PopoverPanel
                modal
                transition
                className="absolute bottom-full right-0 z-10 !min-h-0 w-[280px] -translate-y-3 rounded-lg transition duration-200 ease-out data-[closed]:translate-y-1 data-[closed]:opacity-0"
            >
                {content}
            </PopoverPanel>
        );
    return content;
}
