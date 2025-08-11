import { Popover, Transition } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type ChangeEvent, Fragment, useMemo, useRef } from 'react';
import { useAsyncFn } from 'react-use';

import ImageIcon from '@/assets/image.svg';
import VideoIcon from '@/assets/video.svg';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { FileMimeType } from '@/constants/enum.js';
import {
    ALLOWED_IMAGES_MIMES,
    ALLOWED_VIDEO_MIMES,
    GIF_MEDIA_SOURCE_CONFIG,
    SUPPORTED_VIDEO_SOURCES,
} from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { getCurrentPostGifLimits, getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { getVideoMetadata } from '@/helpers/getVideoMetadata.js';
import { createLocalMediaObject, createVideoMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { isValidPostImage, isValidPostVideo } from '@/helpers/validatePostFile.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { captureImageAddClickEvent, captureVideoAddClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { MediaSource } from '@/types/compose.js';

interface MediaProps {
    close: () => void;
}
export function Media({ close }: MediaProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const { type, updateVideo, updateImages } = useComposeStateStore();
    const { availableSources, video, images } = useCompositePost();

    const maxGifCount = getCurrentPostGifLimits(availableSources);
    const maxImageCount = getCurrentPostImageLimits(type, availableSources);

    const [, handleImageChange] = useAsyncFn(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;

            if (files?.length) {
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
                    return [...images, ...validFiles.map((file) => createLocalMediaObject(file))].slice(
                        0,
                        maxImageCount,
                    );
                });
                captureImageAddClickEvent();
            }
            close();
        },
        [maxImageCount, availableSources, close, updateImages],
    );

    const isMedium = useIsMedium();

    const [{ loading }, handleVideoChange] = useAsyncFn(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;

            if (files?.length) {
                const file = files[0];
                const message = await isValidPostVideo(availableSources, file);
                if (message) {
                    return enqueueErrorMessage(message);
                }
                const metadata = await runInSafeAsync(() => getVideoMetadata(file));
                updateVideo(createVideoMediaObject(file, metadata));
                captureVideoAddClickEvent();
            }
            close();
        },
        [availableSources, close, updateVideo],
    );

    const allowedImagesMimes = useMemo(() => {
        const disableLocalGif = availableSources.some((x) => !GIF_MEDIA_SOURCE_CONFIG[x].includes(MediaSource.Local));
        return disableLocalGif ? ALLOWED_IMAGES_MIMES.filter((x) => x !== FileMimeType.GIF) : ALLOWED_IMAGES_MIMES;
    }, [availableSources]);

    const disableVideo =
        !!video || images.length > 0 || availableSources.some((source) => !SUPPORTED_VIDEO_SOURCES.includes(source));
    const disableImage =
        images.length >= maxImageCount || images.filter((x) => x.file.type === FileMimeType.GIF).length >= maxGifCount;

    const content = (
        <div>
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
}
