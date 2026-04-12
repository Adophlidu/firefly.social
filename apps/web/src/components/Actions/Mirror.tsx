'use client';

import MirrorIcon from '@dimensiondev/assets/mirror.svg';
import MirrorLargeIcon from '@dimensiondev/assets/mirror-large.svg';
import QuoteDownIcon from '@dimensiondev/assets/quote-down.svg';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Menu, MenuButton as HeadlessMenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { Fragment, memo, useMemo } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { type SocialSource, Source } from '@/constants/enum.js';
import { humanize } from '@/helpers/formatCommentCounts.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { openComposeModal } from '@/helpers/openComposeModal.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import { useAnonymousPostAvailability } from '@/hooks/useAnonymousPostAvailability.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useMirror } from '@/hooks/useMirror.js';
import type { Post } from '@/providers/types/SocialMedia.js';

function getTooltipContent(source: SocialSource, shares: number) {
    if (shares === 0) {
        switch (source) {
            case Source.Lens:
                return <Trans id="mirror-tooltip-repost-or-quote">Repost or Quote</Trans>;
            case Source.Farcaster:
                return <Trans id="mirror-tooltip-recast-or-quote">Recast or Quote</Trans>;
            case Source.Twitter:
                return <Trans>Repost</Trans>;
            case Source.Bsky:
                return <Trans>Repost</Trans>;
            default:
                safeUnreachable(source);
                return null;
        }
    }

    switch (source) {
        case Source.Lens:
            return <Plural value={shares} one="Repost or Quote" other="Reposts or Quotes" />;
        case Source.Farcaster:
            return <Plural value={shares} one="Recast or Quote" other="Recasts or Quotes" />;
        case Source.Twitter:
            return <Trans>Repost</Trans>;
        case Source.Bsky:
            return <Trans>Repost</Trans>;
        default:
            safeUnreachable(source);
            return null;
    }
}

interface MirrorUIProps {
    shares: number;
    source: SocialSource;
    postId: string;
    disabled: boolean;
    mirrorDisabled: boolean;
    quoteDisabled: boolean;
    canUndoMirror: boolean;
    mirrorLoading: boolean;
    hasQuoted: boolean;
    hasMirrored: boolean;
    handleMirror: (unmirror?: boolean) => void;
    handleQuote: () => void;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MirrorUI = memo<MirrorUIProps>(function Mirror({
    canUndoMirror,
    disabled,
    handleMirror,
    handleQuote,
    hasQuoted,
    hasMirrored,
    mirrorDisabled,
    mirrorLoading,
    onClick,
    quoteDisabled,
    shares,
    source,
}) {
    const mirrorActionText = useMemo(() => {
        switch (source) {
            case Source.Lens:
                return hasMirrored ? <Trans>Repost again</Trans> : <Trans>Repost</Trans>;
            case Source.Farcaster:
                return hasMirrored ? <Trans>Cancel Recast</Trans> : <Trans>Recast</Trans>;
            case Source.Twitter:
                return hasMirrored ? <Trans>Cancel Repost</Trans> : <Trans>Repost</Trans>;
            case Source.Bsky:
                return hasMirrored ? <Trans>Cancel Repost</Trans> : <Trans>Repost</Trans>;
            default:
                safeUnreachable(source);
                return null;
        }
    }, [source, hasMirrored]);

    const allDisabled = mirrorDisabled && quoteDisabled;

    return (
        <Menu className="relative" as="div" onClick={stopEvent}>
            <HeadlessMenuButton
                disabled={allDisabled}
                className={classNames(
                    'text-second hover:text-secondarySuccess relative flex w-min items-center md:space-x-2',
                    !!disabled || allDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                    {
                        'text-secondarySuccess': hasMirrored,
                    },
                )}
                aria-label="Repost"
                onClick={onClick}
            >
                <Tooltip
                    disabled={disabled || mirrorLoading || allDisabled}
                    placement="top"
                    content={
                        <span>
                            {shares ? humanize(shares) : null} {getTooltipContent(source, shares)}
                        </span>
                    }
                >
                    <span className="hover:bg-secondarySuccess/[.20] inline-flex size-7 items-center justify-center rounded-full">
                        {mirrorLoading ? (
                            <LoadingIcon className="text-second" size={16} />
                        ) : (
                            <MirrorIcon
                                width={16}
                                height={16}
                                className={hasMirrored || hasQuoted ? 'text-secondarySuccess' : ''}
                            />
                        )}
                    </span>
                </Tooltip>
            </HeadlessMenuButton>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform-gpu opacity-0 scale-95"
                enterTo="transform-gpu opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform-gpu opacity-100 scale-100"
                leaveTo="transform-gpu opacity-0 scale-95"
            >
                <MenuItems className="z-menu border-line bg-primaryBottom text-main absolute flex w-max flex-col gap-2 overflow-hidden rounded-2xl border py-3 text-base outline-none">
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                disabled={mirrorDisabled}
                                className={classNames(
                                    'flex w-full cursor-pointer items-center space-x-1 whitespace-nowrap md:space-x-2',
                                    {
                                        'text-secondarySuccess': hasMirrored,
                                    },
                                )}
                                onClick={() => {
                                    close();
                                    handleMirror();
                                }}
                            >
                                <MirrorLargeIcon width={18} height={18} />
                                <span className="font-medium">
                                    {mirrorDisabled ? <Trans>Mirror disabled</Trans> : mirrorActionText}
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>

                    {canUndoMirror ? (
                        <MenuItem>
                            {({ close }) => (
                                <MenuButton
                                    className="text-danger flex w-full cursor-pointer items-center space-x-1 md:space-x-2"
                                    onClick={() => {
                                        close();
                                        handleMirror(true);
                                    }}
                                >
                                    <MirrorLargeIcon width={18} height={18} />
                                    <span className="font-medium">
                                        <Trans>Undo repost</Trans>
                                    </span>
                                </MenuButton>
                            )}
                        </MenuItem>
                    ) : null}

                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                className="flex w-full cursor-pointer items-center space-x-1 whitespace-nowrap md:space-x-2"
                                disabled={quoteDisabled}
                                onClick={() => {
                                    close();
                                    handleQuote();
                                }}
                            >
                                <QuoteDownIcon width={17} height={17} />
                                <span className="font-medium">
                                    {quoteDisabled ? <Trans>Quote posts disabled</Trans> : <Trans>Quote post</Trans>}
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                </MenuItems>
            </Transition>
        </Menu>
    );
});

interface MirrorProps {
    shares?: number;
    source: SocialSource;
    postId: string;
    disabled?: boolean;
    post: Post;
}

export const Mirror = memo<MirrorProps>(function Mirror({ shares = 0, source, disabled = false, post }) {
    const profile = useCurrentProfile(source);

    const isLogin = !!profile?.profileId;
    const mirrored = !!post.hasMirrored;

    const canUndoMirror = post.source === Source.Lens && mirrored && post.publicationId !== post.postId;
    const [{ loading, value }, handleMirror] = useMirror(post);

    const { canPost, sources } = useAnonymousPostAvailability();
    const anonymousPostEnabled = !isLogin && canPost && sources.includes(source);

    const mirrorDisabled = post.canMirror === false && !!profile;
    const quoteDisabled =
        post.canQuote === false && !!profile && (post.source !== Source.Bsky || !isSameProfile(post.author, profile));
    const allDisabled = mirrorDisabled && quoteDisabled;

    const onClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        if (allDisabled) return;

        if (!isLogin && !loading && !anonymousPostEnabled) {
            event.preventDefault();
            openLoginModal({ source: post.source });
            return;
        }
    };

    const handleQuote = () => {
        openComposeModal({
            type: 'quote',
            post,
            source,
            channel: post.channel,
            isAnonymous: anonymousPostEnabled,
        });
    };

    return (
        <MirrorUI
            shares={shares}
            source={source}
            postId={post.postId}
            disabled={disabled}
            mirrorDisabled={mirrorDisabled}
            quoteDisabled={quoteDisabled}
            canUndoMirror={canUndoMirror}
            mirrorLoading={loading}
            handleMirror={handleMirror}
            onClick={onClick}
            handleQuote={handleQuote}
            hasQuoted={!!post.hasQuoted}
            hasMirrored={!!post.hasMirrored}
        />
    );
});
