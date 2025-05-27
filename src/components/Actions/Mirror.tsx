'use client';

import { autoUpdate, flip, offset, shift, useDismiss, useFloating, useInteractions } from '@floating-ui/react';
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
import { humanize } from '@/helpers/formatCommentCounts.js';
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
}

export const Mirror = memo<MirrorProps>(function Mirror({ shares = 0, source, disabled = false, post }) {
    const [open, setOpen] = useState(false);
    const profile = useCurrentProfile(source);

    const isLogin = !!profile?.profileId;
    const mirrored = !!post.hasMirrored;

    const canUndoMirror = post.source === Source.Lens && mirrored && post.publicationId !== post.postId;
    const [{ loading }, handleMirror] = useMirror(post);

    const mirrorDisabled = post.canMirror === false && !!profile;
    const quoteDisabled =
        post.canQuote === false && !!profile && (post.source !== Source.Bsky || !isSameProfile(post.author, profile));
    const allDisabled = mirrorDisabled && quoteDisabled;
    const onClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (allDisabled) return;

        if (!isLogin && !loading) {
            LoginModalRef.open({ source: post.source });
            return;
        }
        setOpen(true);
        return;
    };

    const handleQuote = () => {
        setOpen(false);
        ComposeModalRef.open({
            type: 'quote',
            post,
            source,
            channel: post.channel,
        });
    };
    return (
        <MirrorUI
            old={false}
            open={open}
            setOpen={setOpen}
            shares={shares}
            source={source}
            postId={post.postId}
            disabled={disabled}
            mirrorDisabled={mirrorDisabled}
            quoteDisabled={quoteDisabled}
            canUndoMirror={canUndoMirror}
            mirrorLoading={loading}
            handleMirror={handleMirror}
            hasQuoted={!!post.hasQuoted}
            onClick={onClick}
            handleQuote={handleQuote}
            mirrored={!!post.hasMirrored}
        />
    );
});

interface MirrorUIProps {
    open: boolean;
    mirrored: boolean;
    setOpen: (open: boolean) => void;
    shares: number;
    source: SocialSource;
    postId: string;
    disabled: boolean;
    mirrorDisabled: boolean;
    quoteDisabled: boolean;
    canUndoMirror: boolean;
    mirrorLoading: boolean;
    hasQuoted: boolean;
    handleMirror: (unmirror?: boolean) => void;
    handleQuote: () => void;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    old: boolean;
}

export const MirrorUI = memo<MirrorUIProps>(function Mirror({
    open,
    setOpen,
    canUndoMirror,
    disabled,
    handleMirror,
    handleQuote,
    hasQuoted,
    mirrorDisabled,
    mirrored,
    mirrorLoading,
    onClick,
    quoteDisabled,
    shares,
    source,
    old,
}) {
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

    const allDisabled = mirrorDisabled && quoteDisabled;
    const { refs, floatingStyles, context } = useFloating<HTMLDivElement>({
        open,
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [offset({ mainAxis: 7, crossAxis: -30 }), shift(), flip()],
        onOpenChange(nextOpen) {
            setOpen(nextOpen);
        },
    });
    const dismiss = useDismiss(context, {
        enabled: !old,
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

    const floating = (
        <div
            ref={old ? undefined : refs.setFloating}
            style={old ? undefined : floatingStyles}
            className="floating-card z-[5] mt-1 space-y-2 rounded-2xl bg-primaryBottom px-4 py-2 text-main shadow-messageShadow hover:text-main"
            {...getFloatingProps()}
        >
            <ClickableButton
                disabled={mirrorDisabled}
                className={classNames('flex w-full cursor-pointer items-center space-x-1 md:space-x-2', {
                    'text-secondarySuccess': mirrored,
                })}
                onClick={() => {
                    setOpen(false);
                    handleMirror();
                }}
            >
                <MirrorLargeIcon width={18} height={18} />
                <span className="font-medium">
                    {mirrorDisabled ? <Trans>Mirror disabled</Trans> : mirrorActionText}
                </span>
            </ClickableButton>

            {canUndoMirror ? (
                <div
                    className="flex w-full cursor-pointer items-center space-x-1 text-danger md:space-x-2"
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
                className="flex w-full cursor-pointer items-center space-x-1 md:space-x-2"
                disabled={quoteDisabled}
                onClick={handleQuote}
            >
                <QuoteDownIcon width={17} height={17} />
                <span className="font-medium">
                    {quoteDisabled ? <Trans>Quote posts disabled</Trans> : <Trans>Quote post</Trans>}
                </span>
            </ClickableButton>
        </div>
    );
    const children = (
        <motion.button
            ref={old ? undefined : refs.setReference}
            whileTap={{ scale: 0.9 }}
            aria-label="Repost"
            disabled={allDisabled}
            onClick={onClick}
            className={classNames(
                'relative flex w-min items-center text-second hover:text-secondarySuccess md:space-x-2',
                !!disabled || allDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                {
                    'text-secondarySuccess': mirrored,
                },
            )}
            {...getReferenceProps()}
        >
            <Tooltip
                disabled={disabled || open || mirrorLoading || allDisabled}
                placement="top"
                content={shares ? `${humanize(shares)} ${content}` : content}
            >
                <span className="inline-flex size-7 items-center justify-center rounded-full hover:bg-secondarySuccess/[.20]">
                    {mirrorLoading ? (
                        <LoadingIcon className="text-second" size={16} />
                    ) : (
                        <MirrorIcon
                            width={16}
                            height={16}
                            className={mirrored || hasQuoted ? 'text-secondarySuccess' : ''}
                        />
                    )}
                </span>
            </Tooltip>
        </motion.button>
    );
    return old ? (
        <Tippy
            disabled={allDisabled}
            visible={open}
            onClickOutside={() => setOpen(false)}
            appendTo={() => document.body}
            offset={[-30, -2]}
            placement="top"
            className="tippy-card"
            duration={200}
            arrow={false}
            interactive
            content={floating}
        >
            {children}
        </Tippy>
    ) : (
        <>
            {open ? floating : null}
            {children}
        </>
    );
});
