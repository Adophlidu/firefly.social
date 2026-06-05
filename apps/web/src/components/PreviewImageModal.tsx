'use client';

import 'swiper/css';

import type { SocialSourceInURL } from '@dimensiondev/enums';
import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { t } from '@lingui/core/macro';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import urlcat from 'urlcat';

import { ClickableButton } from '@/components/ClickableButton.js';
import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { PostMediaSidebar } from '@/components/PostMediaSidebar.js';
import { Tooltip } from '@/components/Tooltip.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { PreviewContent } from '@/modals/PreviewMediaModal/PreviewContent.js';
import type { Attachment } from '@/providers/types/SocialMedia.js';

export function PreviewImageModal({
    assets,
    index,
    source,
    postId,
}: {
    assets: Attachment[];
    index: number;
    source: SocialSourceInURL;
    postId: string;
}) {
    const router = useRouter();
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const isMedium = useIsMedium();

    const close = useCallback(() => {
        router.replace(urlcat('/post/:source/:id', { id: postId, source }));
    }, [router, postId, source]);

    const resolvedSource = resolveSocialSource(source);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <Modal open disableDialogClose={false} enableBackdrop={false} onClose={close}>
            <div className="fixed left-0 top-0 z-modal flex size-full">
                <div
                    className="relative flex min-w-0 flex-1 cursor-pointer items-center justify-center bg-black/90"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        close();
                    }}
                >
                    <div className="absolute left-4 top-4 z-50 cursor-pointer text-main">
                        <CloseButton
                            onClick={close}
                            className="hover:!bg-transparent"
                            IconProps={{ className: '!text-white' }}
                        />
                    </div>
                    {isMedium ? (
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
                            modules={[Navigation, Keyboard]}
                            navigation={{
                                prevEl: prevRef.current,
                                nextEl: nextRef.current,
                            }}
                            onBeforeInit={(swiper) => {
                                if (typeof swiper.params.navigation === 'object') {
                                    swiper.params.navigation.prevEl = prevRef.current;
                                    swiper.params.navigation.nextEl = nextRef.current;
                                }
                            }}
                            keyboard
                            initialSlide={index}
                        >
                            {assets.map((asset, key) => {
                                return (
                                    <SwiperSlide key={key} className="flex">
                                        <div className="flex size-full items-center justify-center">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <PreviewContent source={resolvedSource} asset={asset} />
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                );
                            })}
                            <ClickableButton
                                ref={prevRef}
                                className="prev-button absolute left-[50px] top-[50%] z-50 max-md:hidden"
                                aria-label="Previous image"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ArrowLeftIcon
                                    width={24}
                                    height={24}
                                    className="rounded-full p-1 text-main hover:bg-bg"
                                />
                            </ClickableButton>
                            <ClickableButton
                                ref={nextRef}
                                className="next-button absolute right-[50px] top-[50%] z-50 max-md:hidden"
                                aria-label="Next image"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ArrowRightIcon
                                    width={24}
                                    height={24}
                                    className="rounded-full p-1 text-main hover:bg-bg"
                                />
                            </ClickableButton>
                        </Swiper>
                    </div>
                </div>

                {isMedium && sidebarOpen ? (
                    <PostMediaSidebar postId={postId} source={resolvedSource} onClose={close} />
                ) : null}
            </div>
        </Modal>
    );
}
