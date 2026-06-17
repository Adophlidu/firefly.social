'use client';

import { EngagementType, PageRoute, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Plural, Trans } from '@lingui/react/macro';
import dayjs from 'dayjs';
import { compact, sumBy } from 'lodash-es';
import { Fragment, type HTMLProps, memo, type ReactNode, useMemo } from 'react';

import { PostPublishPlatform } from '@/components/Actions/PostPublishPlatform.js';
import { Link } from '@/components/Link.js';
import { ChannelAnchor } from '@/components/Posts/ChannelAnchor.js';
import { Time } from '@/components/Semantic/Time.js';
import { usePathname } from '@/esm/navigation.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { formatLocalizedDate, formatLocalizedTime, getTimeLeft } from '@/helpers/formatTimestamp.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolvePostEngagementUrl } from '@/helpers/resolveEngagementUrl.js';
import { useLocale } from '@/hooks/useLocale.js';
import type { Poll } from '@/providers/types/Poll.js';
import type { Post } from '@/providers/types/SocialMedia.js';

interface Props extends HTMLProps<HTMLDivElement> {
    post: Post;
    showChannelTag?: boolean;
    isComment?: boolean;
    hideDate?: boolean;
    hideSource?: boolean;
    onSetScrollIndex?: () => void;
}

function EngagementLink({
    children,
    prefetch = false,
    ...props
}: {
    post: Post;
    type: EngagementType;
    prefetch?: boolean;
    children?: ReactNode;
    onSetScrollIndex?: () => void;
}) {
    if (props.post.source === Source.Twitter && props.type === EngagementType.Likes) return children;
    return (
        <Link
            prefetch={prefetch}
            className="hover:underline"
            href={resolvePostEngagementUrl(props.post, props.type)}
            onClick={(ev) => {
                ev.stopPropagation();
                props.onSetScrollIndex?.();
            }}
        >
            {children}
        </Link>
    );
}

function getPollTimeLeft(endDatetime: string) {
    const timeLeft = getTimeLeft(endDatetime);
    if (!timeLeft) return <Trans>Final results</Trans>;

    const { days, hours, minutes, seconds } = timeLeft;

    if (days >= 1) return <Plural value={days} one="# day left" other="# days left" />;
    if (hours >= 1) return <Plural value={hours} one="# hour left" other="# hours left" />;
    if (minutes >= 1) return <Plural value={minutes} one="# minute left" other="# minutes left" />;
    if (seconds >= 1) return <Plural value={seconds} one="# second left" other="# seconds left" />;
    return <Trans>Final results</Trans>;
}

function PollVotes({ poll }: { poll: Poll }) {
    const { timeLeft, totalVotes } = useMemo(
        () => ({
            timeLeft:
                poll.votingStatus === 'closed' || (poll.endDatetime && dayjs(poll.endDatetime).isBefore(new Date())) ? (
                    <Trans>Final results</Trans>
                ) : poll.endDatetime ? (
                    getPollTimeLeft(poll.endDatetime)
                ) : null,
            totalVotes: sumBy(poll.options, (option) => option.votes ?? 0),
        }),
        [poll],
    );

    return (
        <>
            <data value={totalVotes}>
                <Plural value={totalVotes} one={`${totalVotes} Vote`} other={`${totalVotes} Votes`} />
            </data>
            {timeLeft ? (
                <data value={poll.endDatetime}>
                    {' · '}
                    {timeLeft}
                </data>
            ) : null}
        </>
    );
}

export const PostStatistics = memo<Props>(function PostStatistics({
    className,
    post,
    showChannelTag = true,
    isComment = false,
    hideDate = false,
    hideSource = false,
    onSetScrollIndex,
}: Props) {
    const pathname = usePathname();
    const locale = useLocale();

    const comments = post.stats?.comments ? (
        <data value={post.stats.comments}>
            <span className="mr-[2px] font-bold">{nFormatter(post.stats.comments)}</span>
            <Plural value={post.stats.comments} one="comment" other="comments" />
        </data>
    ) : null;
    const likes = post.stats?.reactions ? (
        <EngagementLink post={post} type={EngagementType.Likes} onSetScrollIndex={onSetScrollIndex}>
            <data value={post.stats.reactions}>
                <span className="mr-[2px] font-bold">{nFormatter(post.stats.reactions)}</span>
                <Plural value={post.stats.reactions} one="like" other="likes" />
            </data>
        </EngagementLink>
    ) : null;
    const collects = post.stats?.countOpenActions ? (
        <data value={post.stats.countOpenActions}>
            <span className="mr-[2px] font-bold">{nFormatter(post.stats.countOpenActions)}</span>
            <Plural value={post.stats.countOpenActions} one="collect" other="collects" />
        </data>
    ) : null;
    const mirrors = post.stats?.mirrors ? (
        <EngagementLink
            post={post}
            type={[Source.Farcaster].includes(post.source) ? EngagementType.Recasts : EngagementType.Mirrors}
            onSetScrollIndex={onSetScrollIndex}
        >
            <data value={post.stats.mirrors}>
                <span className="mr-[2px] font-bold">{nFormatter(post.stats.mirrors)}</span>
                {{
                    [Source.Farcaster]: <Plural value={post.stats.mirrors} one="recast" other="recasts" />,
                    [Source.Lens]: <Plural value={post.stats.mirrors} one="repost" other="reposts" />,
                    [Source.Twitter]: <Plural value={post.stats.mirrors} one="repost" other="reposts" />,
                    [Source.Bsky]: <Plural value={post.stats.mirrors} one="repost" other="reposts" />,
                }[post.source] ?? null}
            </data>
        </EngagementLink>
    ) : null;
    const quotes = post.stats?.quotes ? (
        <EngagementLink post={post} type={EngagementType.Quotes} onSetScrollIndex={onSetScrollIndex}>
            <data value={post.stats.quotes}>
                <span className="mr-[2px] font-bold">{nFormatter(post.stats.quotes)}</span>
                <Plural value={post.stats.quotes} one="quote" other="quotes" />
            </data>
        </EngagementLink>
    ) : null;
    const pollVotes = post.poll ? <PollVotes poll={post.poll} /> : null;
    const views =
        post.source === Source.Twitter && post.stats?.views ? (
            <data value={post.stats.views}>
                <span className="mr-[2px] font-bold">{nFormatter(post.stats.views)}</span>
                <Plural value={post.stats.views} one="view" other="views" />
            </data>
        ) : null;
    const isDetailPage = isRoutePathname(pathname, PageRoute.PostDetail, true);
    const isChannelPage = isRoutePathname(pathname, PageRoute.Channel, true);

    const statisticsItems =
        !isDetailPage || isComment
            ? compact([
                  comments,
                  likes,
                  pollVotes,
                  !isDetailPage && showChannelTag && post.channel?.name && !isChannelPage ? (
                      <ChannelAnchor
                          className="!inline-flex align-middle"
                          channel={post.channel}
                          onClick={onSetScrollIndex}
                      />
                  ) : null,
              ])
            : compact([
                  post.timestamp && !hideDate ? (
                      <Time dateTime={post.timestamp}>
                          <span>{formatLocalizedTime(post.timestamp, locale)}</span>
                          <span>{' · '}</span>
                          <span>{formatLocalizedDate(post.timestamp, locale)}</span>
                      </Time>
                  ) : null,
                  views,
                  likes,
                  comments,
                  mirrors,
                  quotes,
                  collects,
                  pollVotes,
                  !hideSource ? <PostPublishPlatform post={post} /> : null,
              ]);

    if (!statisticsItems.length) return null;

    return (
        <div
            className={classNames(
                'flex min-h-6 w-full flex-wrap justify-between text-xs leading-6 text-second',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-1">
                {statisticsItems.map((item, i) => {
                    return (
                        <Fragment key={i}>
                            <span className="empty:hidden [&:not(:first-of-type)]:before:content-['_·_']">{item}</span>
                        </Fragment>
                    );
                })}
            </div>
        </div>
    );
});
