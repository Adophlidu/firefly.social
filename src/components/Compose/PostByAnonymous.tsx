import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import AnonymousAvatar from '@/assets/anonymous-avatar.svg';
import InfoIcon from '@/assets/info-outline.svg';
import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { RestrictionType, type SocialSource, Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { useAnonymousPostAvailability } from '@/hooks/useAnonymousPostAvailability.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface PostByAnonymousProps {
    disabled?: boolean;
}

export const anonymousHandle: Record<SocialSource, string | null> = {
    [Source.Farcaster]: 'anoncast',
    [Source.Twitter]: 'anoncast_',
    [Source.Bsky]: null,
    [Source.Lens]: null,
};

export const PostByAnonymous = memo<PostByAnonymousProps>(function PostByAnonymous({ disabled = false }) {
    const { loading, data, canPost, sources } = useAnonymousPostAvailability();

    const { scheduleTime } = useComposeScheduleStateStore();
    const { availableSources, isAnonymous, poll, rpPayload } = useCompositePost();
    const { posts, type, sealedSource, toggleAnonymous, enableSource, disableSource, updateRestriction } =
        useComposeStateStore();

    const toggleSource = useCallback(
        (source: SocialSource) => {
            if (availableSources.includes(source) && isAnonymous) {
                const newSources = availableSources.filter((x) => x !== source);
                disableSource(source);
                if (!newSources.length || newSources.every((x) => !sources.includes(x))) {
                    toggleAnonymous(false);
                }
            } else {
                if (!isAnonymous) {
                    availableSources.forEach((x) => {
                        if (x !== source) {
                            disableSource(x);
                        }
                    });
                    updateRestriction(RestrictionType.Everyone);
                }
                enableSource(source);
                toggleAnonymous(true);
            }
        },
        [availableSources, isAnonymous, sources, disableSource, enableSource, toggleAnonymous, updateRestriction],
    );

    if (loading || !canPost || !data) return null;

    const hasConflictContent = !!poll || !!rpPayload || !!scheduleTime || posts.length > 1;
    const mustWait = data.wait_minutes > 0 || data.wait_seconds > 0;
    const anonymousDisabled = disabled || hasConflictContent || mustWait;

    return (
        <div className="w-full shrink-0 space-y-2">
            <div className="flex h-8 items-center justify-between px-3">
                <Tooltip
                    appendTo={() => document.body}
                    placement="top"
                    interactive
                    content={
                        <div className="leading-5">
                            <Trans>
                                Your post will be shared anonymously through:
                                <br />X (Twitter): <span className="text-highlight">@anoncast_</span>
                                <br />
                                Farcaster: <span className="text-highlight">@anoncast</span> /{' '}
                                <span className="text-highlight">@anonworld</span>
                                <p className="mt-1.5">
                                    Limits: <span className="font-bold">{data.daily_limit} posts/day</span> with
                                    {` ${data.wait_minutes}`}-minute intervals (applies to posts, replies, and quotes).
                                </p>
                                <p className="mt-1.5">
                                    Posts are anonymized using secure algorithms (takes a few minutes). Do not share
                                    sensitive content.
                                </p>
                            </Trans>
                        </div>
                    }
                >
                    <ClickableButton className="flex items-center gap-0.5 text-second">
                        <span className="text-sm font-medium">
                            <Trans>Anonymous</Trans>
                        </span>
                        <InfoIcon width={14} height={14} />
                    </ClickableButton>
                </Tooltip>
                <span className="text-sm text-main">
                    {data.daily_remaining}/{data.daily_limit}
                </span>
            </div>
            {sources.map((source) => {
                const checked = isAnonymous && availableSources.includes(source);
                const handle = anonymousHandle[source];
                const disabled = type !== 'compose' && sealedSource !== source;

                return !handle ? null : (
                    <ClickableButton
                        key={source}
                        disabled={disabled || anonymousDisabled}
                        onClick={() => toggleSource(source)}
                        className="flex h-8 w-full items-center justify-between gap-2 px-3 hover:bg-bg"
                    >
                        <div className="relative shrink-0">
                            <AnonymousAvatar width={24} height={24} className="size-6 rounded-full" />
                            <SocialSourceIcon
                                className="absolute -bottom-1 -right-1 z-10 rounded-full border border-white dark:border-gray-900"
                                source={source}
                                size={12}
                            />
                        </div>
                        <span
                            className={classNames(
                                'min-w-0 flex-1 truncate text-left',
                                checked ? 'text-main' : 'text-secondary',
                            )}
                        >
                            @{handle}
                        </span>
                        {mustWait ? (
                            <Tooltip
                                appendTo={() => document.body}
                                interactive
                                placement="top"
                                content={
                                    <p className="leading-5">
                                        {data.wait_minutes ? (
                                            <Trans>
                                                Limits: <span className="font-bold">{data.daily_limit} posts/day</span>{' '}
                                                with {data.wait_minutes}-minute intervals (applies to posts, replies,
                                                and quotes).
                                            </Trans>
                                        ) : (
                                            <Trans>
                                                Limits: <span className="font-bold">{data.daily_limit} posts/day</span>{' '}
                                                with {data.wait_seconds}-second intervals (applies to posts, replies,
                                                and quotes).
                                            </Trans>
                                        )}
                                    </p>
                                }
                            >
                                <InfoIcon className="cursor-pointer" width={18} height={18} />
                            </Tooltip>
                        ) : (
                            <CircleCheckboxIcon className="shrink-0" size={18} checked={checked} />
                        )}
                    </ClickableButton>
                );
            })}
        </div>
    );
});
