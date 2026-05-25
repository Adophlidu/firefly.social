import { Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { compact, values } from 'lodash-es';
import { useMemo } from 'react';

import { AddThread } from '@/components/Compose/ComposeActions/AddThread.js';
import { ChooseChannelAction } from '@/components/Compose/ComposeActions/ChannelAction.js';
import { EmojiAction } from '@/components/Compose/ComposeActions/EmojiAction.js';
import { MediaAction } from '@/components/Compose/ComposeActions/MediaAction.js';
import { PlatformAction } from '@/components/Compose/ComposeActions/PlatformAction.js';
import { RedPacketAction } from '@/components/Compose/ComposeActions/RedPacketAction.js';
import { ReplyRestrictionAction } from '@/components/Compose/ComposeActions/ReplyRestrictionAction.js';
import { ComposeSend } from '@/components/Compose/ComposeSend.js';
import { SchedulePostEntryButton } from '@/components/Compose/SchedulePostEntryButton.js';
import { GifEntryButton } from '@/components/Gif/GifEntryButton.js';
import { PollButton } from '@/components/Poll/PollButton.js';
import {
    getCurrentPostGifLimits,
    getCurrentPostImageLimits,
    getCurrentPostVideoLimits,
} from '@/helpers/getCurrentPostImageLimits.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function ComposeActions() {
    const isMedium = useIsMedium();
    const { type, posts } = useComposeStateStore();
    const { scheduleTime, disableSchedule } = useComposeScheduleStateStore();
    const { availableSources, images, videos, poll, rpPayload, isAnonymous } = useCompositePost();

    const hasError = useMemo(() => {
        return posts.some((x) => !!compact(values(x.postError)).length);
    }, [posts]);

    const maxImageCount = Math.min(
        getCurrentPostImageLimits(type, availableSources),
        getCurrentPostGifLimits(availableSources),
    );
    const maxVideoCount = getCurrentPostVideoLimits(availableSources);

    const mediaDisabled = videos.length >= maxVideoCount || !!poll || !!rpPayload || images.length >= maxImageCount;
    const showFarcasterChannel =
        availableSources.includes(Source.Farcaster) && (type === 'compose' || type === 'quote');
    const showLensChannel = availableSources.includes(Source.Lens) && type === 'compose';
    const showReplyScope = type !== 'reply' && !(type === 'quote' && availableSources.includes(Source.Farcaster));

    return (
        <div className="px-4 pb-4">
            <div className="mb-2 flex flex-wrap gap-2">
                <div className="flex items-center gap-x-1 rounded-[6px] border border-secondaryLine p-2">
                    <PlatformAction hasError={hasError} />
                </div>
                {showReplyScope && !isAnonymous ? <ReplyRestrictionAction hasError={hasError} /> : null}

                {showFarcasterChannel && !isAnonymous ? (
                    <div className="rounded-[6px] border border-secondaryLine p-2">
                        <ChooseChannelAction source={Source.Farcaster} hasError={hasError} />
                    </div>
                ) : null}
                {showLensChannel ? (
                    <div className="rounded-[6px] border border-secondaryLine p-2">
                        <ChooseChannelAction source={Source.Lens} hasError={hasError} />
                    </div>
                ) : null}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-3">
                    <MediaAction />

                    {envs.external.NEXT_PUBLIC_COMPOSE_GIF === STATUS.Enabled ? (
                        <GifEntryButton disabled={mediaDisabled} />
                    ) : null}

                    <EmojiAction />

                    {type === 'compose' && envs.external.NEXT_PUBLIC_POLL === STATUS.Enabled && !isAnonymous ? (
                        <PollButton />
                    ) : null}

                    {!isAnonymous && !disableSchedule ? (
                        <SchedulePostEntryButton className="text-main" disabled={!!rpPayload} />
                    ) : null}

                    {!scheduleTime && !mediaDisabled && isMedium && !isAnonymous ? (
                        <RedPacketAction disabled={mediaDisabled} />
                    ) : null}
                </div>

                {isMedium ? <ComposeSend /> : <AddThread />}
            </div>
        </div>
    );
}
