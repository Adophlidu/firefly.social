/* eslint-disable @next/next/no-img-element */
'use client';

import Play from '@dimensiondev/assets/play.svg';
import { IMAGE_KIT_ATTACHMENT } from '@dimensiondev/constants/static';
import { AttachmentType } from '@dimensiondev/enums';
import { memo } from 'react';

import { WithPreviewLink } from '@/components/Posts/WithPreviewLink.js';
import { formatImageUrl } from '@/helpers/formatImageUrl.js';
import { getPostPreviewAttachments } from '@/helpers/getPostPreviewAttachments.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface TwitterMediaGalleryItemProps {
    post: Post;
}

export const TwitterMediaGalleryItem = memo(function TwitterMediaGalleryItem({ post }: TwitterMediaGalleryItemProps) {
    const attachments = getPostPreviewAttachments(post);
    const asset = attachments[0];
    if (!asset) return null;

    const isPlayable = asset.type === AttachmentType.Video || asset.type === AttachmentType.AnimatedGif;
    const thumbUri = asset.type === AttachmentType.Image ? asset.uri : asset.coverUri || asset.uri;
    const imageUrl = formatImageUrl(thumbUri, IMAGE_KIT_ATTACHMENT);

    return (
        <WithPreviewLink post={post} index={0} useModal>
            <div className="relative aspect-square w-full cursor-pointer overflow-hidden bg-lightBg">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <img src={imageUrl} alt="" className="absolute inset-0 size-full opacity-0" style={{ zIndex: -1 }} />
                {isPlayable ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white">
                            <Play width={16} height={16} />
                        </div>
                    </div>
                ) : null}
                {attachments.length > 1 ? (
                    <div className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                        +{attachments.length - 1}
                    </div>
                ) : null}
            </div>
        </WithPreviewLink>
    );
});
