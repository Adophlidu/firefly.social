'use client';

import { classNames } from '@dimensiondev/utils';
import { Popover, Transition } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type ChangeEvent, Fragment, memo, useMemo, useRef } from 'react';
import { useAsyncFn } from 'react-use';

import ImageIcon from '@/assets/image.svg';
import VideoIcon from '@/assets/video.svg';
import { useUpdateImages } from '@/components/Compose/useUpdateImages.js';
import { useUpdateVideos } from '@/components/Compose/useUpdateVideos.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import {
    ALLOWED_IMAGES_MIMES,
    ALLOWED_VIDEO_MIMES,
    GIF_MEDIA_SOURCE_CONFIG,
    SUPPORTED_VIDEO_SOURCES,
} from '@/constants/computed.js';
import { FileMimeType } from '@/constants/enum.js';
import {
    getCurrentPostGifLimits,
    getCurrentPostImageLimits,
    getCurrentPostVideoLimits,
} from '@/helpers/getCurrentPostImageLimits.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { captureImageAddClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { MediaSource } from '@/types/compose.js';

interface MediaProps {
    close: () => void;
}

export const Media = memo(function Media({ close }: MediaProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const { type } = useComposeStateStore();
    const { availableSources, videos, images } = useCompositePost();

    const maxGifCount = getCurrentPostGifLimits(availableSources);
    const maxImageCount = getCurrentPostImageLimits(type, availableSources);
    const maxVideoCount = getCurrentPostVideoLimits(availableSources);

    const updateImages = useUpdateImages();
    const updateVideos = useUpdateVideos();
    const [, handleImageChange] = useAsyncFn(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;

            if (files?.length) {
                updateImages([...files], availableSources, type);
                captureImageAddClickEvent();
            }
            close();
        },
        [close, updateImages, availableSources, type],
    );

    const isMedium = useIsMedium();

    const [{ loading }, handleVideoChange] = useAsyncFn(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;

            if (files?.length) {
                await updateVideos([...files], availableSources);
            }
            close();
        },
        [availableSources, close, updateVideos],
    );

    const allowedImagesMimes = useMemo(() => {
        const disableLocalGif = availableSources.some((x) => !GIF_MEDIA_SOURCE_CONFIG[x].includes(MediaSource.Local));
        return disableLocalGif ? ALLOWED_IMAGES_MIMES.filter((x) => x !== FileMimeType.GIF) : ALLOWED_IMAGES_MIMES;
    }, [availableSources]);

    const disableVideo =
        videos.length >= maxVideoCount ||
        images.length > 0 ||
        availableSources.some((source) => !SUPPORTED_VIDEO_SOURCES.includes(source));

    const disableImage =
        videos.length > 0 ||
        images.length >= maxImageCount ||
        images.filter((x) => x.file.type === FileMimeType.GIF).length >= maxGifCount;

    const content = (
        <div role="menu">
            <div>
                <div
                    className={classNames(
                        'flex h-12 items-center gap-2 p-3',
                        disableImage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-bg',
                    )}
                    onClick={() => {
                        if (disableImage) return;

                        imageInputRef.current?.click();
                    }}
                    role="menuitem"
                    aria-disabled={disableVideo}
                    aria-label={t`Image`}
                >
                    <ImageIcon width={24} height={24} />
                    <span className="font-bold">
                        <Trans>Image</Trans>
                    </span>
                </div>

                <input
                    type="file"
                    accept={allowedImagesMimes.join(', ')}
                    multiple
                    ref={imageInputRef}
                    className="hidden"
                    onChange={handleImageChange}
                />
            </div>
            <div>
                <div
                    className={classNames(
                        'flex h-12 items-center gap-2 p-3',
                        disableVideo ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-bg',
                    )}
                    onClick={() => {
                        if (disableVideo) return;

                        videoInputRef.current?.click();
                    }}
                    role="menuitem"
                    aria-disabled={disableVideo}
                    aria-label={t`Video`}
                >
                    {loading ? <LoadingIcon /> : <VideoIcon width={24} height={24} />}
                    <span className="font-bold">
                        <Trans>Video</Trans>
                    </span>
                </div>

                <input
                    type="file"
                    accept={ALLOWED_VIDEO_MIMES.join(', ')}
                    ref={videoInputRef}
                    className="hidden"
                    multiple={maxVideoCount > 1}
                    onChange={handleVideoChange}
                />
            </div>
        </div>
    );

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
                <Popover.Panel
                    static
                    className="absolute bottom-full left-0 z-50 w-[280px] -translate-y-3 rounded-lg bg-lightBottom py-3 text-main shadow-popover dark:border dark:border-line dark:bg-darkBottom dark:shadow-none"
                >
                    {content}
                </Popover.Panel>
            </Transition>
        );

    return <>{content}</>;
});
