'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo, useCallback, useMemo } from 'react';

import FireflyMonochromeIcon from '@/assets/firefly-monochrome.svg';
import LikeIcon from '@/assets/like.svg';
import { ActivityCellSnapshotAction } from '@/components/ActivityCell/Snapshot/ActivityCellSnapshotAction.js';
import { ArticleBody } from '@/components/Article/ArticleBody.js';
import { Avatar } from '@/components/Avatar.js';
import { BetsActivityBody } from '@/components/Bets/BetsActivityBody.js';
import { SnapshotBody } from '@/components/Snapshot/SnapshotBody.js';
import { SnapshotFallbackContent } from '@/components/Snapshot/SnapshotFallbackContent.js';
import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { ARTICLE_LIKE_NOTIFICATION_TYPES } from '@/constants/computed.js';
import { useRouter } from '@/esm/navigation.js';
import { formatArticleFromNotification } from '@/helpers/formatArticleFromNotification.js';
import { formatPolymarketFromFirefly } from '@/helpers/formatPolymarketFromFirefly.js';
import { formatSnapshotChoice } from '@/helpers/formatSnapshotChoice.js';
import { formatSnapshotActivityFromNotification } from '@/helpers/formatSnapshotFromNotification.js';
import { getArticleUrl } from '@/helpers/getArticleUrl.js';
import type { SnapshotActivity } from '@/providers/snapshot/type.js';
import type { UnifiedNotification } from '@/providers/types/Firefly.js';
import { NotificationType } from '@/providers/types/SocialMedia.js';

interface UnifiedNotificationItemProps {
    notification: UnifiedNotification;
}

interface UnifiedNotificationBaseProps {
    user: UnifiedNotification['data']['user'];
    timestamp: number;
    title: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
    isClickable?: boolean;
}

interface LikeNotificationTitleProps {
    userName: string;
    itemType: 'article' | 'bet activity' | 'DAO activity' | 'NFT';
}

function LikeNotificationTitle({ userName, itemType }: LikeNotificationTitleProps) {
    return (
        <Trans>
            <span className="font-bold">{userName}</span> liked your <strong>{itemType}</strong>
        </Trans>
    );
}

function UnifiedNotificationBase({
    user,
    timestamp,
    title,
    children,
    onClick,
    isClickable = true,
}: UnifiedNotificationBaseProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={classNames('border-b border-secondaryLine px-4 py-3 dark:border-line', {
                'cursor-pointer hover:bg-bg': isClickable,
            })}
            onClick={isClickable ? onClick : undefined}
        >
            <div className="flex justify-between">
                <div className="flex max-w-full flex-1 items-start gap-4">
                    <div className="flex h-10 items-center">
                        <LikeIcon className="text-secondary" width={24} height={24} />
                    </div>
                    <div className="max-w-[calc(100%-40px)] flex-1">
                        <div className="flex flex-1 items-center justify-between">
                            {user?.avatar ? (
                                <Avatar src={user.avatar} size={40} alt={user.account_id || user.display_name || ''} />
                            ) : null}
                            <div className="flex items-center space-x-2">
                                <FireflyMonochromeIcon
                                    fontSize={15}
                                    width={15}
                                    height={15}
                                    className="inline shrink-0 text-second"
                                />
                                <span className="text-xs leading-4 text-secondary">
                                    <TimestampFormatter time={timestamp} />
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 flex min-w-0 items-center gap-[0.2em] whitespace-nowrap text-medium">
                            {title}
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

interface ArticleLikeNotificationProps {
    notification: UnifiedNotification;
}

function ArticleLikeNotification({ notification }: ArticleLikeNotificationProps) {
    const router = useRouter();
    const user = notification.data.user;
    const data = notification.data;

    const userName = user?.display_name;

    const article = useMemo(() => {
        return formatArticleFromNotification(data);
    }, [data]);

    const handleClick = useCallback(() => {
        router.push(getArticleUrl(article));
    }, [article, router]);

    if (!userName) return null;

    return (
        <UnifiedNotificationBase
            user={user}
            timestamp={notification.timestamp}
            title={<LikeNotificationTitle userName={userName} itemType="article" />}
            onClick={handleClick}
        >
            <div className="mt-2">
                <ArticleBody article={article} cover={undefined} onClick={handleClick} />
            </div>
        </UnifiedNotificationBase>
    );
}

interface BetLikeNotificationProps {
    notification: UnifiedNotification;
}

function BetLikeNotification({ notification }: BetLikeNotificationProps) {
    const user = notification.data.user;
    const data = notification.data;
    const userName = user?.display_name;

    const betActivity = useMemo(() => {
        if (data?.transactionHash && data?.eventSlug) {
            return formatPolymarketFromFirefly(data);
        }
        return null;
    }, [data]);

    if (!userName) return null;

    return (
        <UnifiedNotificationBase
            user={user}
            timestamp={notification.timestamp}
            title={<LikeNotificationTitle userName={userName} itemType="bet activity" />}
            isClickable={false}
        >
            {betActivity ? (
                <div className="mt-2 min-w-0 flex-1 overflow-hidden">
                    <BetsActivityBody activity={betActivity} />
                </div>
            ) : null}
        </UnifiedNotificationBase>
    );
}

interface DAOLikeNotificationProps {
    notification: UnifiedNotification;
}

function DAOLikeNotification({ notification }: DAOLikeNotificationProps) {
    const user = notification.data.user;
    const data = notification.data;
    const userName = user?.display_name;

    const daoActivity = useMemo<SnapshotActivity | null>(() => {
        return formatSnapshotActivityFromNotification(data);
    }, [data]);

    if (!userName || !daoActivity) return null;

    const label = daoActivity.proposal
        ? formatSnapshotChoice(daoActivity.choice, daoActivity.proposal?.type, daoActivity.proposal?.choices)
        : null;

    return (
        <UnifiedNotificationBase
            user={user}
            timestamp={notification.timestamp}
            title={<LikeNotificationTitle userName={userName} itemType="DAO activity" />}
            isClickable={false}
        >
            <div className="mt-2">
                <ActivityCellSnapshotAction>
                    <TextOverflowTooltip className="max-sm:block" placement="top-start" content={label}>
                        <span className="truncate">{label}</span>
                    </TextOverflowTooltip>
                </ActivityCellSnapshotAction>
            </div>
            <div className="mt-2 min-w-0 flex-1 overflow-hidden">
                {daoActivity.proposal ? (
                    <div>
                        <SnapshotBody activity={daoActivity} snapshot={daoActivity.proposal} showVote={false} />
                    </div>
                ) : (
                    <SnapshotFallbackContent {...daoActivity.fallback_content} />
                )}
            </div>
        </UnifiedNotificationBase>
    );
}

interface NFTLikeNotificationProps {
    notification: UnifiedNotification;
}

function NFTLikeNotification({ notification }: NFTLikeNotificationProps) {
    const user = notification.data.user;
    const userName = user?.display_name;

    if (!userName) return null;

    return (
        <UnifiedNotificationBase
            user={user}
            timestamp={notification.timestamp}
            title={<LikeNotificationTitle userName={userName} itemType="NFT" />}
        />
    );
}

export const UnifiedNotificationItem = memo<UnifiedNotificationItemProps>(function UnifiedNotificationItem({
    notification,
}) {
    const isArticleNotification = ARTICLE_LIKE_NOTIFICATION_TYPES.includes(notification.type as NotificationType);
    if (isArticleNotification) return <ArticleLikeNotification notification={notification} />;

    switch (notification.type) {
        case NotificationType.LikeBets:
            return <BetLikeNotification notification={notification} />;
        case NotificationType.LikeDAO:
            return <DAOLikeNotification notification={notification} />;
        case NotificationType.LikeNFT:
            return <NFTLikeNotification notification={notification} />;
        case NotificationType.Act:
        case NotificationType.Comment:
        case NotificationType.Follow:
        case NotificationType.LikeBets:
        case NotificationType.LikeDAO:
        case NotificationType.LikeLimo:
        case NotificationType.LikeMatters:
        case NotificationType.LikeMirror:
        case NotificationType.LikeNFT:
        case NotificationType.LikeParagraph:
        case NotificationType.Mention:
        case NotificationType.Mirror:
        case NotificationType.Quote:
        case NotificationType.Reaction:
        case NotificationType.Schedule:
        case NotificationType.Tips:
            return null;
        default:
            safeUnreachable(notification.type);
            return null;
    }
});
