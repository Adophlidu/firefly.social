'use client';

import PlayIcon from '@dimensiondev/assets/play.svg';
import { AttachmentType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { memo } from 'react';

import { resolveDmMediaLayout } from '@/components/DirectMessages/mediaLayout.js';
import { MessageCaption } from '@/components/DirectMessages/MessageCaption.js';
import type { DirectMessageItem } from '@/components/DirectMessages/types.js';
import { openPreviewMediaModal } from '@/controllers/openPreviewMediaModal.js';

type MediaMessageItem = Extract<DirectMessageItem, { kind: 'media' }>;

export const MediaMessage = memo(function MediaMessage({ item }: { item: MediaMessageItem }) {
    const isPending = item.status === 'pending';
    const isSingle = item.attachments.length === 1;

    return (
        <div className="overflow-hidden rounded-[22px] border border-line bg-lightBg p-1 shadow-sm">
            <div
                className={classNames('grid max-w-[420px] gap-1 overflow-hidden rounded-[18px]', {
                    'grid-cols-2': item.attachments.length > 1,
                })}
            >
                {item.attachments.map((attachment, index) => {
                    const mediaLayout = resolveDmMediaLayout(attachment);

                    return (
                        <button
                            key={`${item.id}-${index}`}
                            type="button"
                            className={classNames(
                                'relative flex items-center justify-center overflow-hidden bg-black/5',
                                {
                                    'size-36': !isSingle,
                                    'max-h-[420px] max-w-[min(72vw,420px)]': isSingle,
                                },
                            )}
                            style={
                                isSingle
                                    ? {
                                          width: `min(72vw, ${mediaLayout.width}px)`,
                                          aspectRatio: mediaLayout.aspectRatio,
                                      }
                                    : undefined
                            }
                            aria-label={attachment.type === 'video' ? t`Preview video` : t`Preview image`}
                            onClick={() =>
                                openPreviewMediaModal({
                                    index,
                                    source: Source.Lens,
                                    medias: item.attachments.map((media) => ({
                                        type: media.type === 'video' ? AttachmentType.Video : AttachmentType.Image,
                                        uri: media.url,
                                        coverUri: media.coverUrl,
                                        width: media.width,
                                        height: media.height,
                                    })),
                                })
                            }
                        >
                            {attachment.type === 'video' ? (
                                <video
                                    src={attachment.url}
                                    poster={attachment.coverUrl}
                                    width={attachment.width}
                                    height={attachment.height}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className={classNames('block object-contain', {
                                        'size-36 object-cover': !isSingle,
                                        'size-full': isSingle,
                                    })}
                                />
                            ) : (
                                // Orb media can use user-defined hosts that are not compatible with Next Image's allowlist.
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={attachment.coverUrl ?? attachment.url}
                                    alt=""
                                    width={attachment.width}
                                    height={attachment.height}
                                    className={classNames('block object-contain', {
                                        'size-36 object-cover': !isSingle,
                                        'size-full': isSingle,
                                    })}
                                />
                            )}
                            {attachment.type === 'video' ? (
                                <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10 text-white">
                                    <span className="grid size-10 place-items-center rounded-full bg-black/55 shadow-md">
                                        <PlayIcon width={16} height={16} />
                                    </span>
                                </span>
                            ) : null}
                            {isPending ? (
                                <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
                                    <span className="size-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
            <MessageCaption content={item.content} variant="attached" />
        </div>
    );
});
