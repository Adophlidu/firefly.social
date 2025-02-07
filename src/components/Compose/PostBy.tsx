import { PopoverPanel, Transition } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { uniq } from 'lodash-es';
import { Fragment, useMemo } from 'react';

import { PostByItem } from '@/components/Compose/PostByItem.js';
import { FileMimeType } from '@/constants/enum.js';
import {
    ENABLED_SCHEDULE_POST_SOURCES,
    GIF_MEDIA_SOURCE_CONFIG,
    SORTED_POLL_SOURCES,
    SORTED_SOCIAL_SOURCES,
} from '@/constants/index.js';
import { ensureGifSource } from '@/helpers/checkPostGif.js';
import { getCurrentPostGifLimits, getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { resolveSourcesName } from '@/helpers/resolveSourceName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function PostBy() {
    const { poll, availableSources, images } = useCompositePost();
    const { type } = useComposeStateStore();
    const { scheduleTime } = useComposeScheduleStateStore();

    const postByDisabled = useMemo(() => {
        return SORTED_SOCIAL_SOURCES.map((source) => {
            if (poll && !SORTED_POLL_SOURCES.includes(source))
                return {
                    disabled: true,
                    reason: t`Polls are only available on ${resolveSourcesName(SORTED_POLL_SOURCES)}.`,
                };

            if (scheduleTime && !ENABLED_SCHEDULE_POST_SOURCES.includes(source))
                return {
                    disabled: true,
                    reason: t`Scheduled posts are only available on ${resolveSourcesName(ENABLED_SCHEDULE_POST_SOURCES)}.`,
                };

            const maxImageCount = getCurrentPostImageLimits(type, uniq([...availableSources, source]));
            if (images.length > maxImageCount)
                return {
                    disabled: true,
                    reason: t`Image count limit reached.`,
                };

            const maxGifCount = getCurrentPostGifLimits(uniq([...availableSources, source]));
            if (images.filter((x) => x.file.type === FileMimeType.GIF).length > maxGifCount)
                return {
                    disabled: true,
                    reason: t`GIF count limit reached.`,
                };

            if (!ensureGifSource(images, source))
                return {
                    disabled: true,
                    reason: t`GIF source not supported. Supported sources: ${GIF_MEDIA_SOURCE_CONFIG[source].join(', ')}.`,
                };

            return { disabled: false };
        });
    }, [availableSources, images, poll, type, scheduleTime]);

    const content = (
        <div className="no-scrollbar flex max-h-[184px] flex-col gap-2 overflow-y-auto rounded-lg bg-lightBottom py-3 text-medium shadow-popover dark:border dark:border-line dark:bg-darkBottom dark:shadow-none md:max-h-[208px]">
            {SORTED_SOCIAL_SOURCES.map((source, index) => (
                <PostByItem key={source} source={source} {...postByDisabled[index]} />
            ))}
        </div>
    );

    const isMedium = useIsMedium();

    if (isMedium)
        return (
            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0 translate-y-1"
            >
                <PopoverPanel
                    anchor="top start"
                    portal
                    modal
                    static
                    className="absolute bottom-full right-0 z-10 !min-h-0 w-[280px] -translate-y-3 [--anchor-max-height:184px] md:[--anchor-max-height:208px]"
                >
                    {content}
                </PopoverPanel>
            </Transition>
        );
    return content;
}
