import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { compact, first, last } from 'lodash-es';
import { useCallback } from 'react';

import FireflyRoundIcon from '@/assets/firefly-pure.svg';
import ScheduleIcon from '@/assets/schedule.svg';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { SORTED_SCHEDULE_POST_SOURCES } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { ComposeModalRef } from '@/modals/ComposeModal.js';
import { PostMediaType, type ScheduleNotification, ScheduleTaskStatus } from '@/providers/types/Firefly.js';

interface ScheduleNotificationItemProps {
    data: ScheduleNotification;
}

export function ScheduleNotificationItem({ data }: ScheduleNotificationItemProps) {
    const router = useRouter();
    const timestamp = first(data.data.posts)?.publish_timestamp;
    const sortedPosts = compact(
        SORTED_SCHEDULE_POST_SOURCES.map((x) => {
            return data.data.posts.find((post) => {
                const source = resolveSocialSource(post.platform);
                return source === x;
            });
        }),
    );

    const sourceNames = sortedPosts.map((x) => resolveSourceName(resolveSocialSource(x.platform)));

    const sortedSourceNames =
        sourceNames.length > 1
            ? t`${sourceNames.slice(0, -1).join(', ')} and ${last(sourceNames) ?? ''}`
            : first(sourceNames);

    const description = sortedSourceNames
        ? data.status === ScheduleTaskStatus.Success
            ? t`Published successfully on ${sortedSourceNames}`
            : t`Failed to publish on ${sortedSourceNames}`
        : '';

    const firstPost = first(sortedPosts);
    const failedPost = sortedPosts.find((x) => !!x.error);

    const display_info = firstPost?.display_info;
    const handleClickPost = useCallback(() => {
        if (data.status === ScheduleTaskStatus.Success && firstPost?.post_id) {
            router.push(resolvePostUrl(resolveSocialSource(firstPost.platform), firstPost.post_id));
        } else if (data.status === ScheduleTaskStatus.Failed) {
            ComposeModalRef.open({
                chars: display_info?.content,
                source: sortedPosts.map((x) => resolveSocialSource(x.platform)),
            });
        }
    }, [data.status, display_info?.content, firstPost?.platform, firstPost?.post_id, router, sortedPosts]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-b border-secondaryLine px-4 py-3 hover:bg-bg dark:border-line"
        >
            <div className="flex w-full cursor-pointer items-center gap-4">
                <ScheduleIcon className="shrink-0 text-secondary" width={24} height={24} />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                        <div className="text-[15px] font-bold leading-4 text-main">
                            <Trans>Scheduled Post</Trans>
                        </div>
                        <div className="flex items-center space-x-2">
                            <FireflyRoundIcon className="text-secondary" fontSize={15} width={15} height={15} />
                            {timestamp ? (
                                <span className="text-xs leading-4 text-secondary">
                                    <TimestampFormatter time={timestamp} />
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-3 text-[15px] leading-4 text-main">{description}</div>
                    <div
                        className="mt-3 cursor-pointer rounded-2xl border border-line bg-bg p-3"
                        onClick={handleClickPost}
                    >
                        {data.status === ScheduleTaskStatus.Failed ? (
                            <div className="text-[12px] font-bold leading-4 text-danger">
                                <Trans>Failed Post</Trans>
                            </div>
                        ) : null}
                        <div className="line-clamp-5 break-words text-left text-medium leading-[24px]">
                            {firstPost?.display_info?.content}
                            {firstPost?.display_info?.media_type?.length ? (
                                <span>
                                    <br />
                                    {firstPost?.display_info.media_type
                                        .map((x) => {
                                            if (x === PostMediaType.Text) return;
                                            return `[${x}]`;
                                        })
                                        .filter(Boolean)
                                        .join('')}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
