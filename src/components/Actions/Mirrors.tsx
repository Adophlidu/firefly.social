'use client';

import { plural, t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { motion } from 'framer-motion';
import { memo, useMemo, useState } from 'react';

import MirrorIcon from '@/assets/mirror.svg';
import MirrorLargeIcon from '@/assets/mirror-large.svg';
import QuoteDownIcon from '@/assets/quote-down.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { Tippy } from '@/esm/Tippy.js';
import { classNames } from '@/helpers/classNames.js';
import { humanize, nFormatter } from '@/helpers/formatCommentCounts.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useMirror } from '@/hooks/useMirror.js';
import { ComposeModalRef, LoginModalRef } from '@/modals/controls.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface MirrorProps {
    shares?: number;
    source: SocialSource;
    postId: string;
    disabled?: boolean;
    post: Post;
    hiddenCount?: boolean;
}

export const Mirror = memo<MirrorProps>(function Mirror({
    shares = 0,
    source,
    disabled = false,
    post,
    hiddenCount = false,
}) {
    const [open, setOpen] = useState(false);
    const profile = useCurrentProfile(source);

    const isLogin = !!profile?.profileId;
    const mirrored = !!post.hasMirrored;

    const canUndoMirror = useMemo(() => {
        return post.source === Source.Lens && mirrored && post.publicationId !== post.postId;
    }, [post.source, post.publicationId, post.postId, mirrored]);
    const mirrorDisabled = useMemo(() => {
        return post.canMirror === false && !!profile && !isSameProfile(post.author, profile);
    }, [post.canMirror, post.author, profile]);

    const content = useMemo(() => {
        if (shares === 0) {
            switch (source) {
                case Source.Lens:
                    return t`Repost or Quote`;
                case Source.Farcaster:
                    return t`Recast or Quote`;
                case Source.Twitter:
                    return t`Repost`;
                case Source.Bsky:
                    return t`Repost`;
                default:
                    safeUnreachable(source);
                    return '';
            }
        }

        switch (source) {
            case Source.Lens:
                return plural(shares, {
                    one: 'Repost or Quote',
                    other: 'Reposts or Quotes',
                });
            case Source.Farcaster:
                return plural(shares, {
                    one: 'Recast or Quote',
                    other: 'Recasts or Quotes',
                });
            case Source.Twitter:
                return t`Repost`;
            case Source.Bsky:
                return t`Repost`;
            default:
                safeUnreachable(source);
                return '';
        }
    }, [source, shares]);

    const mirrorActionText = useMemo(() => {
        switch (source) {
            case Source.Lens:
                return mirrored ? t`Repost again` : t`Repost`;
            case Source.Farcaster:
                return mirrored ? t`Cancel Recast` : t`Recast`;
            case Source.Twitter:
                return mirrored ? t`Cancel Retweet` : t`Retweet`;
            case Source.Bsky:
                return mirrored ? t`Cancel Repost` : t`Repost`;
            default:
                safeUnreachable(source);
                return '';
        }
    }, [source, mirrored]);

    const [{ loading }, handleMirror] = useMirror(post);

    return (
        <Tippy
            visible={open}
            onClickOutside={() => setOpen(false)}
            appendTo={() => document.body}
            offset={[-30, -2]}
            placement="top"
            className="tippy-card"
            duration={200}
            arrow={false}
            interactive
            content={
                <div className="z-[5] mt-1 space-y-2 rounded-2xl bg-primaryBottom px-4 py-2 text-main shadow-messageShadow hover:text-main">
                    <div
                        className={classNames('flex cursor-pointer items-center space-x-1 md:space-x-2', {
                            'text-secondarySuccess': mirrored,
                        })}
                        onClick={() => {
                            setOpen(false);
                            handleMirror();
                        }}
                    >
                        <MirrorLargeIcon width={18} height={18} />
                        <span className="font-medium">{mirrorActionText}</span>
                    </div>

                    {canUndoMirror ? (
                        <div
                            className="flex cursor-pointer items-center space-x-1 text-danger md:space-x-2"
                            onClick={() => {
                                setOpen(false);
                                handleMirror(true);
                            }}
                        >
                            <MirrorLargeIcon width={18} height={18} />
                            <span className="font-medium">
                                <Trans>Undo repost</Trans>
                            </span>
                        </div>
                    ) : null}

                    <ClickableButton
                        className="flex cursor-pointer items-center space-x-1 md:space-x-2"
                        disabled={mirrorDisabled}
                        onClick={() => {
                            setOpen(false);
                            ComposeModalRef.open({
                                type: 'quote',
                                post,
                                source,
                            });
                        }}
                    >
                        <QuoteDownIcon width={17} height={17} />
                        <span className="font-medium">
                            {mirrorDisabled ? <Trans>Quote posts disabled</Trans> : <Trans>Quote post</Trans>}
                        </span>
                    </ClickableButton>
                </div>
            }
        >
            <motion.div
                whileTap={{ scale: 0.9 }}
                aria-label="Repost"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!isLogin && !loading) {
                        LoginModalRef.open({ source: post.source });
                        return;
                    }
                    setOpen(true);
                    return;
                }}
                className={classNames(
                    'relative flex w-min cursor-pointer items-center text-lightSecond hover:text-secondarySuccess md:space-x-2',
                    {
                        'text-secondarySuccess': mirrored,
                        'opacity-50': !!disabled,
                    },
                )}
            >
                <Tooltip
                    disabled={disabled || open || loading}
                    placement="top"
                    content={shares ? `${humanize(shares)} ${content}` : content}
                >
                    <span className="inline-flex size-7 items-center justify-center rounded-full hover:bg-secondarySuccess/[.20]">
                        {loading ? (
                            <LoadingIcon className="text-lightSecond" size={16} />
                        ) : (
                            <MirrorIcon
                                width={16}
                                height={16}
                                className={mirrored || post.hasQuoted ? 'text-secondarySuccess' : ''}
                            />
                        )}
                    </span>
                </Tooltip>
                {!hiddenCount && shares ? (
                    <span
                        className={classNames('text-xs', {
                            'font-medium': !mirrored && !post.hasQuoted,
                            'font-bold text-secondarySuccess': mirrored || !!post.hasQuoted,
                        })}
                    >
                        {nFormatter(shares)}
                    </span>
                ) : null}
            </motion.div>
        </Tippy>
    );
});
