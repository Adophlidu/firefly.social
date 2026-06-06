'use client';

import 'swiper/css';

import { EMPTY_LIST } from '@dimensiondev/constants';
import { AttachmentType, type Source } from '@dimensiondev/enums';
import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { t } from '@lingui/core/macro';
import { useMemo, useState } from 'react';
import type { Swiper as SwiperClass } from 'swiper';
import { Keyboard, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { PostMediaSidebar } from '@/components/PostMediaSidebar.js';
import { Tooltip } from '@/components/Tooltip.js';
import { GALLERY_MEDIA_TYPES } from '@/helpers/getPostPreviewAttachments.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { PreviewContent } from '@/modals/PreviewMediaModal/PreviewContent.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

export interface PreviewMediaModalContentProps {
    index: number;
    source: Source;
    post?: Post;
    medias?: Attachment[];
    onClose: () => void;
}

export function PreviewMediaModalContent({ onClose, post, source, medias, index }: PreviewMediaModalContentProps) {
    const isMedium = useIsMedium();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [swiper, setSwiper] = useState<SwiperClass | null>(null);
    const [activeIndex, setActiveIndex] = useState(index);

    const assets = useMemo(() => {
        if (medias) return medias;
        if (!post) return EMPTY_LIST;
        const asset = post.metadata.content?.asset;
        const attachments =
            post.metadata.content?.attachments?.filter((x) => GALLERY_MEDIA_TYPES.includes(x.type)) ?? EMPTY_LIST;

        if (asset?.type === AttachmentType.Image && attachments.length === 1) {
            return [asset];
        }
        return attachments;
    }, [post, medias]);

    return (
        <div className="flex size-full">
            <div
                className="relative flex min-w-0 flex-1 items-center justify-center"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                <div className="absolute left-4 top-4 z-50 cursor-pointer text-main">
                    <CloseButton
                        onClick={onClose}
                        className="hover:!bg-transparent"
                        IconProps={{ className: '!text-white' }}
                    />
                </div>
                {isMedium && post && isSocialSource(source) ? (
                    <Tooltip content={sidebarOpen ? t`Hide` : t`Show`} placement="bottom">
                        <ClickableButton
                            className="absolute right-4 top-4 z-50 rounded p-1"
                            aria-label={sidebarOpen ? t`Hide` : t`Show`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSidebarOpen((v) => !v);
                            }}
                        >
                            {sidebarOpen ? (
                                <ChevronRightIcon width={24} height={24} className="text-white" />
                            ) : (
                                <ChevronLeftIcon width={24} height={24} className="text-white" />
                            )}
                        </ClickableButton>
                    </Tooltip>
                ) : null}
                <div className="flex w-full text-main">
                    <Swiper
                        className="w-full min-w-0"
                        modules={[Navigation, Keyboard]}
                        keyboard
                        initialSlide={index}
                        onSwiper={setSwiper}
                        onSlideChange={(instance) => setActiveIndex(instance.activeIndex)}
                    >
                        {assets.map((asset, key) => {
                            return (
                                <SwiperSlide key={key} className="flex">
                                    <div className="flex size-full items-center justify-center">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <PreviewContent source={source} asset={asset} />
                                        </div>
                                    </div>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </div>
                {assets.length > 1 && activeIndex > 0 ? (
                    <ClickableButton
                        className="absolute left-[50px] top-1/2 z-50 -translate-y-1/2 max-md:hidden"
                        aria-label="Previous media"
                        onClick={(e) => {
                            e.stopPropagation();
                            swiper?.slidePrev();
                        }}
                    >
                        <ArrowLeftIcon
                            width={36}
                            height={36}
                            className="rounded-full p-1.5 !text-white hover:bg-white/20"
                        />
                    </ClickableButton>
                ) : null}
                {assets.length > 1 && activeIndex < assets.length - 1 ? (
                    <ClickableButton
                        className="absolute right-[50px] top-1/2 z-50 -translate-y-1/2 max-md:hidden"
                        aria-label="Next media"
                        onClick={(e) => {
                            e.stopPropagation();
                            swiper?.slideNext();
                        }}
                    >
                        <ArrowRightIcon
                            width={36}
                            height={36}
                            className="rounded-full p-1.5 !text-white hover:bg-white/20"
                        />
                    </ClickableButton>
                ) : null}
            </div>

            {isMedium && sidebarOpen && post && isSocialSource(source) ? (
                <PostMediaSidebar postId={post.postId} source={source} onClose={onClose} />
            ) : null}
        </div>
    );
}
