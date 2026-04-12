'use client';

import { safeUnreachable } from '@dimensiondev/utils';
import { Plural, Select, Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { first, uniqBy } from 'lodash-es';
import { memo, useCallback, useMemo } from 'react';

import { PostActions } from '@/components/Actions/index.js';
import { MoreAction } from '@/components/Actions/More.js';
import { AvatarGroup } from '@/components/AvatarGroup.js';
import { Link } from '@/components/Link.js';
import { ExtraProfiles } from '@/components/Notification/ExtraProfiles.js';
import { NotificationPostBody } from '@/components/Notification/NotificationPostBody.js';
import { ProfileLink } from '@/components/Notification/ProfileLink.js';
import { CollapsedContent } from '@/components/Posts/CollapsedContent.js';
import { Quote } from '@/components/Posts/Quote.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { Source } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { toProfileId } from '@/helpers/isSameProfile.js';
import { resolveNotificationIcon } from '@/helpers/resolveNotificationIcon.js';
import { isProfileMuted } from '@/hooks/useIsProfileMuted.js';
import type { ScheduleNotification, TipsNotification, UnifiedNotification } from '@/providers/types/Firefly.js';
import { type Notification, NotificationType } from '@/providers/types/SocialMedia.js';

interface NotificationItemProps {
    notification: Exclude<Notification, TipsNotification | ScheduleNotification | UnifiedNotification>;
}

export const NotificationItem = memo<NotificationItemProps>(function NotificationItem({ notification }) {
    const router = useRouter();
    const Icon = resolveNotificationIcon(notification.type);

    const profiles = useMemo(() => {
        const type = notification.type;
        switch (type) {
            case NotificationType.Reaction:
                return notification.reactors;
            case NotificationType.Quote:
                return notification.quote ? [notification.quote.author] : undefined;
            case NotificationType.Follow:
                return notification.followers;
            case NotificationType.Comment:
                return notification.comment ? [notification.comment.author] : undefined;
            case NotificationType.Mention:
                return notification.post ? [notification.post.author] : undefined;
            case NotificationType.Mirror:
                return uniqBy(notification.mirrors, toProfileId);
            case NotificationType.Act:
                return notification.actions;
            default:
                safeUnreachable(type);
                return;
        }
    }, [notification]);

    const title = useMemo(() => {
        const type = notification.type;
        switch (type) {
            case NotificationType.Reaction:
                const firstReactor = first(notification.reactors);
                if (!firstReactor || !notification.post?.type) return;

                return (
                    <Trans>
                        <Plural
                            value={notification.reactors.length}
                            _1={<ProfileLink profile={firstReactor} />}
                            _2={
                                <Trans>
                                    <ProfileLink profile={firstReactor} /> and{' '}
                                    <ProfileLink profile={notification.reactors[1]} />
                                </Trans>
                            }
                            other={<ExtraProfiles profiles={notification.reactors} />}
                        />{' '}
                        <span>liked your </span>
                        <strong>
                            <Select
                                value={notification.post.type}
                                _Post="post"
                                _Comment="comment"
                                _Quote="quote"
                                _Mirror="repost"
                                other="post"
                            />
                        </strong>
                    </Trans>
                );
            case NotificationType.Quote:
                if (!notification.quote?.quoteOn?.type) return;
                return (
                    <Trans>
                        <ProfileLink profile={notification.quote.author} /> quoted your{' '}
                        <strong>
                            <Select
                                value={notification.quote.quoteOn.type}
                                _Post="post"
                                _Comment="comment"
                                _Quote="quote"
                                _Mirror="repost"
                                other="post"
                            />
                        </strong>
                    </Trans>
                );
            case NotificationType.Follow:
                const followers = notification.followers;
                const firstFollower = first(followers);
                if (!firstFollower) return;

                return (
                    <Trans>
                        <Plural
                            value={followers.length}
                            _1={<ProfileLink profile={firstFollower} />}
                            _2={
                                <Trans>
                                    <ProfileLink profile={firstFollower} /> and <ProfileLink profile={followers[1]} />
                                </Trans>
                            }
                            other={<ExtraProfiles profiles={followers} />}
                        />
                        <span> followed you</span>
                    </Trans>
                );
            case NotificationType.Comment:
                if (!notification.comment?.commentOn?.type) return;
                const author = notification.comment.author;
                return (
                    <Trans>
                        <ProfileLink profile={author} /> commented on your{' '}
                        <strong>
                            <Select
                                value={notification.comment.commentOn.type}
                                _Post="post"
                                _Comment="comment"
                                _Quote="quote"
                                _Mirror="repost"
                                other="post"
                            />
                        </strong>
                    </Trans>
                );
            case NotificationType.Mention:
                if (!notification.post?.type) return;
                const mentionAuthor = notification.post.author;
                return (
                    <Trans>
                        <ProfileLink profile={mentionAuthor} /> mentioned you in a{' '}
                        <strong>
                            <Select
                                value={notification.post.type}
                                _Post="post"
                                _Comment="comment"
                                _Quote="quote"
                                _Mirror="repost"
                                other="post"
                            />
                        </strong>
                    </Trans>
                );
            case NotificationType.Mirror:
                // It's allow to mirror multiple times.
                const mirrors = uniqBy(notification.mirrors, toProfileId);
                const firstMirror = first(mirrors);
                if (!firstMirror || !notification.post?.type) return;
                return (
                    <Trans>
                        <Plural
                            value={mirrors.length}
                            _1={<ProfileLink profile={firstMirror} />}
                            _2={
                                <Trans>
                                    <ProfileLink profile={firstMirror} /> and <ProfileLink profile={mirrors[1]} />
                                </Trans>
                            }
                            other={<ExtraProfiles profiles={mirrors} />}
                        />{' '}
                        <Select
                            value={notification.source}
                            _Lens="reposted your"
                            _Farcaster="recasted your"
                            _Bsky="reposted your"
                            other="reposted your"
                        />{' '}
                        <strong>
                            <Select
                                value={notification.post.type}
                                _Post="post"
                                _Comment="comment"
                                _Quote="quote"
                                _Mirror="repost"
                                other="post"
                            />
                        </strong>
                    </Trans>
                );
            case NotificationType.Act:
                const firstActed = first(notification.actions);
                if (!firstActed || !notification.post.type) return;
                return (
                    <Trans>
                        <Plural
                            value={notification.actions.length}
                            _1={<ProfileLink profile={firstActed} />}
                            _2={
                                <Trans>
                                    <ProfileLink profile={firstActed} /> and{' '}
                                    <ProfileLink profile={notification.actions[1]} />
                                </Trans>
                            }
                            other={<ExtraProfiles profiles={notification.actions} />}
                        />{' '}
                        <span>collected your </span>
                        <strong>
                            <Select
                                value={notification.post.type}
                                _Post="post"
                                _Comment="comment"
                                _Quote="quote"
                                _Mirror="repost"
                                other="post"
                            />
                        </strong>
                    </Trans>
                );
            default:
                safeUnreachable(type);
                return null;
        }
    }, [notification]);

    const content = useMemo(() => {
        const type = notification.type;
        switch (type) {
            case NotificationType.Reaction:
            case NotificationType.Mirror:
            case NotificationType.Act:
                if (!notification.post) return;
                if (isProfileMuted(notification.post.author)) return <CollapsedContent authorMuted isQuote={false} />;
                return <Quote className="bg-bg" post={notification.post} />;
            case NotificationType.Comment:
            case NotificationType.Mention:
                const post = notification.type === NotificationType.Comment ? notification.comment : notification.post;
                if (!post) return;
                const postLink = getPostUrl(post);
                if (isProfileMuted(post.author)) return <CollapsedContent authorMuted isQuote={false} />;
                return (
                    <Link className="mt-1" href={postLink}>
                        <NotificationPostBody post={post} />
                    </Link>
                );
            case NotificationType.Quote:
                if (!notification.quote || !notification.post) return null;
                if (isProfileMuted(notification.post.author)) {
                    return <CollapsedContent authorMuted isQuote={false} />;
                }
                return (
                    <div
                        className="mt-1 cursor-pointer"
                        onClick={(event) => {
                            event.stopPropagation();
                            const selection = window.getSelection();
                            if (selection && selection.toString().length !== 0) return;
                            router.push(getPostUrl(notification.quote));
                        }}
                    >
                        <NotificationPostBody post={notification.quote} />
                        <Quote className="bg-bg" post={notification.post} />
                    </div>
                );
            case NotificationType.Follow:
                return null;
            default:
                safeUnreachable(type);
                return null;
        }
    }, [notification, router]);

    const actions = useMemo(() => {
        const type = notification.type;
        switch (type) {
            case NotificationType.Comment:
                if (!notification.comment || isProfileMuted(notification.comment.author)) return null;
                return <PostActions post={notification.comment} disablePadding />;
            case NotificationType.Mention:
                if (!notification.post || isProfileMuted(notification.post.author)) return null;
                return <PostActions post={notification.post} disablePadding />;
            case NotificationType.Quote:
                if (!notification.quote || isProfileMuted(notification.quote.author)) return null;
                return <PostActions post={notification.quote} disablePadding />;
            case NotificationType.Act:
                return null;
            case NotificationType.Follow:
                return null;
            case NotificationType.Mirror:
                return null;
            case NotificationType.Reaction:
                return null;
            default:
                safeUnreachable(type);
                return null;
        }
    }, [notification]);

    const moreAction = useMemo(() => {
        const type = notification.type;
        switch (type) {
            case NotificationType.Comment:
                if (!notification.comment) return null;
                return (
                    <MoreAction
                        source={notification.source}
                        author={notification.comment.author}
                        post={notification.comment}
                    />
                );

            case NotificationType.Quote:
                const post = [Source.Bsky, Source.Farcaster, Source.Lens].includes(notification.source)
                    ? notification.quote
                    : notification.post;
                return !post ? null : <MoreAction source={post.source} author={post.author} post={post} />;
            case NotificationType.Mention:
            case NotificationType.Act:
                if (!notification.post) return null;
                return (
                    <MoreAction
                        source={notification.post.source}
                        author={notification.post.author}
                        post={notification.post}
                    />
                );
            case NotificationType.Follow:
                if (notification.followers.length > 1) return null;
                const follower = first(notification.followers);
                if (!follower) return null;
                return <MoreAction source={notification.source} author={follower} />;
            case NotificationType.Mirror:
                const mirrors = uniqBy(notification.mirrors, toProfileId);
                if (mirrors.length > 1) return null;
                const reporter = first(mirrors);
                if (!reporter) return null;
                return <MoreAction source={notification.source} author={reporter} />;
            case NotificationType.Reaction:
                if (notification.reactors.length > 1) return null;
                const reactor = first(notification.reactors);
                if (!reactor) return null;
                return <MoreAction source={notification.source} author={reactor} />;
            default:
                safeUnreachable(type);
                return null;
        }
    }, [notification]);

    const handleNotificationClick = useCallback(
        (event: React.MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
                return;
            }

            const selection = window.getSelection();
            if (selection && selection.toString().length !== 0) {
                return;
            }

            const type = notification.type;
            switch (type) {
                case NotificationType.Follow:
                    if (notification.followers.length !== 1) return;
                    const firstFollower = first(notification.followers);
                    if (!firstFollower) return;
                    router.push(getProfileUrl(firstFollower));
                    break;
                case NotificationType.Comment:
                    if (!notification.comment) return;
                    router.push(getPostUrl(notification.comment));
                    break;
                case NotificationType.Reaction:
                    if (!notification.post) return;
                    router.push(getPostUrl(notification.post));
                    break;
                case NotificationType.Quote:
                    if (!notification.quote) return;
                    router.push(getPostUrl(notification.quote));
                    break;
                case NotificationType.Mirror:
                    if (!notification.post) return;
                    router.push(getPostUrl(notification.post));
                    break;
                case NotificationType.Mention:
                case NotificationType.Act:
                    if (!notification.post) return;
                    router.push(getPostUrl(notification.post));
                    break;
                default:
                    safeUnreachable(type);
                    break;
            }
        },
        [notification, router],
    );

    if (!profiles) return;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-secondaryLine hover:bg-bg dark:border-line cursor-pointer border-b px-4 py-3"
            onClick={handleNotificationClick}
        >
            <div className="flex justify-between">
                <div className="flex max-w-full flex-1 items-start gap-4">
                    <div className="flex h-10 items-center">
                        {Icon ? <Icon className="text-secondary" width={24} height={24} /> : null}
                    </div>
                    <div className="max-w-[calc(100%-40px)] flex-1">
                        <div className="flex flex-1 items-center justify-between">
                            <AvatarGroup profiles={profiles.slice(0, 5)} />
                            <div className="flex items-center space-x-2">
                                <SocialSourceIcon mono source={notification.source} className="text-second" />
                                {notification.timestamp &&
                                !(notification.type === NotificationType.Reaction && profiles.length > 1) ? (
                                    <span className="text-secondary text-xs leading-4">
                                        <TimestampFormatter time={notification.timestamp} />
                                    </span>
                                ) : null}
                                {moreAction}
                            </div>
                        </div>
                        <div className="text-medium mt-2 flex min-w-0 items-center gap-[0.2em] whitespace-nowrap">
                            {title}
                        </div>
                        {content}
                        {actions}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
