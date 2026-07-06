'use client';

import LinkIcon from '@dimensiondev/assets/link.svg';
import Music from '@dimensiondev/assets/music.svg';
import Play from '@dimensiondev/assets/play.svg';
import { SUPPORTED_MULTIPLE_EMBED_SOURCES, SUPPORTED_PREVIEW_MEDIA_TYPES } from '@dimensiondev/constants/computed';
import { IMAGE_KIT_ATTACHMENT } from '@dimensiondev/constants/static';
import { AttachmentType } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { memo, type SyntheticEvent, useCallback, useMemo } from 'react';

import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { SingleImage } from '@/components/Posts/SingleImage.js';
import { VideoAsset } from '@/components/Posts/VideoAsset.js';
import { VideoSwiper } from '@/components/Posts/VideoSwiper.js';
import { WithPreviewLink } from '@/components/Posts/WithPreviewLink.js';
import { dynamic } from '@/esm/dynamic.js';
import { formatImageUrl } from '@/helpers/formatImageUrl.js';
import type { Attachment, Post } from '@/providers/types/SocialMedia.js';

const Audio = dynamic(() => import('@/components/Posts/Audio.js').then((module) => module.Audio), { ssr: false });

const getClass = (size: number) => {
    if (size === 1) {
        return {
            aspect: 'aspect-w-16 aspect-h-10',
            row: 'grid-cols-1 grid-rows-1',
        };
    } else if (size >= 5) {
        return {
            aspect: 'aspect-square',
            row: 'grid-cols-3',
        };
    } else if (size === 2) {
        return {
            aspect: 'aspect-w-16 aspect-h-12',
            row: 'grid-cols-2 grid-rows-1',
        };
    } else if (size > 2) {
        return {
            aspect: 'aspect-w-16 aspect-h-12',
            row: 'grid-cols-2 grid-rows-2',
        };
    }
    return {
        aspect: '',
        row: '',
    };
};

interface AttachmentsProps {
    post: Post;
    attachments: Attachment[];
    isQuote?: boolean;
    isDetail?: boolean;
    minimal?: boolean;
}

interface AttachmentGridItemProps {
    post: Post;
    attachment: Attachment;
    index: number;
    minimal: boolean;
    isSoloImage: boolean;
}

// Renders a single grid attachment's WithPreviewLink + media as its own memoized
// component so the media element passed as `children` has a stable reference
// across parent re-renders instead of being recreated inline in a `.map()`.
const AttachmentGridItem = memo<AttachmentGridItemProps>(function AttachmentGridItem({
    post,
    attachment,
    index,
    minimal,
    isSoloImage,
}) {
    const uri = attachment.uri ?? '';
    const handleError = useCallback(
        ({ currentTarget }: SyntheticEvent<HTMLImageElement>) => {
            currentTarget.src = uri;
        },
        [uri],
    );

    const media = useMemo(
        () =>
            attachment.type === AttachmentType.Image ? (
                <Image
                    className="h-full shrink-0 cursor-pointer rounded-lg object-cover"
                    loading="lazy"
                    fill={isSoloImage}
                    width={!isSoloImage ? (minimal ? 120 : 1000) : undefined}
                    height={!isSoloImage ? (minimal ? 120 : 1000) : undefined}
                    style={{
                        maxHeight: isSoloImage && minimal ? 288 : undefined,
                    }}
                    onError={handleError}
                    src={formatImageUrl(uri, IMAGE_KIT_ATTACHMENT)}
                    alt={formatImageUrl(uri, IMAGE_KIT_ATTACHMENT)}
                />
            ) : (
                <div className="flex size-full flex-col overflow-hidden rounded-lg">
                    <VideoAsset
                        videoClassName="mini-video flex-1"
                        asset={attachment}
                        minimal={minimal}
                        source={post.source}
                    />
                </div>
            ),
        [attachment, handleError, isSoloImage, minimal, post.source, uri],
    );

    return (
        <WithPreviewLink
            post={post}
            index={index}
            disablePreview={!SUPPORTED_PREVIEW_MEDIA_TYPES.includes(attachment.type)}
        >
            {media}
        </WithPreviewLink>
    );
});

export const Attachments = memo<AttachmentsProps>(function Attachments({
    attachments,
    post,
    isQuote = false,
    isDetail = false,
    minimal = false,
}) {
    const videos = attachments.filter((a) => a.type === AttachmentType.Video);
    const video: Attachment | undefined = first(videos);
    const gifAttachments = attachments.filter((a) => a.type === AttachmentType.AnimatedGif);
    const imageAttachments = attachments.filter((x) => {
        if (video || gifAttachments.length > 1) return SUPPORTED_PREVIEW_MEDIA_TYPES.includes(x.type);
        return x.type === AttachmentType.Image;
    });
    const asset = imageAttachments[0];

    const attachmentsSnapshot = isDetail ? imageAttachments : imageAttachments.slice(0, minimal ? 4 : 9);
    const moreImageCount = imageAttachments.length - attachmentsSnapshot.length; // If it is 0 or below, there are no more images

    const handleImageError = useCallback(
        (event: SyntheticEvent<HTMLImageElement>) => {
            if (!asset?.uri || event.currentTarget.src === asset.uri) {
                return;
            }
            event.currentTarget.src = asset.uri;
        },
        [asset],
    );

    const isSoloImage =
        !post?.metadata.content?.content &&
        attachmentsSnapshot.length === 1 &&
        attachmentsSnapshot[0].type === AttachmentType.Image;

    const singleAttachmentMedia = useMemo(
        () =>
            asset?.type === AttachmentType.Image ? (
                <div
                    className={classNames({
                        'w-full': !minimal,
                        'w-[120px]': minimal,
                    })}
                >
                    <SingleImage
                        className="cursor-pointer rounded-lg object-cover"
                        width={minimal ? 120 : 1000}
                        height={minimal ? 120 : 1000}
                        onError={handleImageError}
                        src={formatImageUrl(asset.uri, IMAGE_KIT_ATTACHMENT)}
                        alt={formatImageUrl(asset.uri, IMAGE_KIT_ATTACHMENT)}
                    />
                </div>
            ) : asset ? (
                <div
                    className={classNames('overflow-hidden rounded-lg', {
                        'size-[120px] shrink-0 grow-0 basis-[120px]': minimal,
                        'w-full': !minimal,
                    })}
                >
                    <VideoAsset asset={asset} minimal={minimal} source={post.source} />
                </div>
            ) : null,
        [asset, handleImageError, minimal, post.source],
    );

    if (minimal && asset?.type === AttachmentType.Audio) {
        return (
            <div className="size-[120px]">
                {asset.coverUri ? (
                    <div className="relative">
                        <div className="absolute left-[calc(50%-16px)] top-[calc(50%-16px)] flex items-center justify-center rounded-xl bg-third p-2 text-lightTextMain">
                            <Play width={16} height={16} />
                        </div>
                        <Image
                            width={120}
                            height={120}
                            src={asset.coverUri}
                            className="size-[120px] max-w-none"
                            alt={asset.coverUri}
                        />
                    </div>
                ) : (
                    <div className="flex size-[120px] flex-col items-center justify-center space-y-2 rounded-xl bg-secondaryMain px-[7.5px] py-4">
                        <span className="text-primaryBottom opacity-50">
                            <Music width={24} height={24} />
                        </span>
                        <span className="break-keep text-[11px] font-medium leading-[16px] text-secondary">
                            <Trans>Audio Cover</Trans>
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={classNames('flex flex-col gap-3 empty:hidden', {
                'w-[120px]': minimal,
                'mt-3': !minimal && !isQuote,
                'mt-2': isQuote,
            })}
        >
            {attachmentsSnapshot.length === 1 && asset ? (
                <WithPreviewLink
                    post={post}
                    index={0}
                    disablePreview={!SUPPORTED_PREVIEW_MEDIA_TYPES.includes(asset.type)}
                >
                    {singleAttachmentMedia}
                </WithPreviewLink>
            ) : null}

            {attachmentsSnapshot.length > 1 ? (
                <div
                    className={classNames(
                        getClass(attachmentsSnapshot.length)?.row ?? '',
                        'grid',
                        minimal ? 'gap-1' : 'gap-2',
                        {
                            'grid-flow-col': attachmentsSnapshot.length === 3,
                            'size-[120px]': minimal && !isSoloImage,
                        },
                    )}
                >
                    {attachmentsSnapshot.map((attachment, index) => {
                        const isLast = attachmentsSnapshot.length === index + 1;
                        return (
                            <div
                                key={index}
                                className={classNames(getClass(attachmentsSnapshot.length).aspect, {
                                    'max-h-[288px]':
                                        (attachmentsSnapshot.length === 2 || attachmentsSnapshot.length === 4) &&
                                        !minimal,
                                    'row-span-2 max-h-[288px]': attachmentsSnapshot.length === 3 && index === 2,
                                    'max-h-[138px]': attachmentsSnapshot.length === 3 && index !== 2 && !minimal,
                                    relative: isLast && moreImageCount > 0,
                                })}
                            >
                                <AttachmentGridItem
                                    post={post}
                                    attachment={attachment}
                                    index={index}
                                    minimal={minimal}
                                    isSoloImage={isSoloImage}
                                />
                                {isLast && moreImageCount > 0 ? (
                                    <div className="absolute right-0 top-0 flex size-full items-center justify-center rounded-lg bg-mainLight/50 text-white">
                                        <div className={classNames('font-bold', minimal ? 'text-medium' : 'text-2xl')}>
                                            +{moreImageCount + 1}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            ) : null}
            {asset?.type === AttachmentType.Audio && !minimal ? (
                <Audio src={asset.uri} poster={asset.coverUri} artist={asset.artist} title={asset.title} />
            ) : null}
            {asset?.type === AttachmentType.Unknown && !minimal ? (
                <div className={classNames('my-2')}>
                    <div
                        className={classNames(
                            'flex items-center justify-between gap-1 rounded-lg border-primaryMain px-3 py-[6px] text-medium',
                            {
                                border: !minimal,
                            },
                        )}
                    >
                        <Trans>No preview found for shared link</Trans>

                        <Link
                            href={asset.uri}
                            className="flex items-center gap-1 text-highlight"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <LinkIcon />
                            <Trans>View Source</Trans>
                        </Link>
                    </div>
                </div>
            ) : null}
            {video && !minimal ? (
                videos.length > 1 && SUPPORTED_MULTIPLE_EMBED_SOURCES.includes(post.source) ? (
                    <VideoSwiper videos={videos} source={post.source} />
                ) : (
                    <div className="w-full overflow-hidden rounded-lg">
                        <VideoAsset asset={video} minimal={minimal} source={post.source} />
                    </div>
                )
            ) : null}
            {!video && gifAttachments.length === 1 && !minimal ? (
                <div className="w-full overflow-hidden rounded-lg">
                    <VideoAsset asset={gifAttachments[0]} minimal={minimal} source={post.source} />
                </div>
            ) : null}
        </div>
    );
});
