import { t } from '@lingui/core/macro';
import { compact, values } from 'lodash-es';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';

import RedPacketIcon from '@/assets/red-packet.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { AddThread } from '@/components/Compose/ComposeActions/AddThread.js';
import { ChooseChannelAction } from '@/components/Compose/ComposeActions/ChannelAction.js';
import { EmojiAction } from '@/components/Compose/ComposeActions/EmojiAction.js';
import { MediaAction } from '@/components/Compose/ComposeActions/MediaAction.js';
import { PlatformAction } from '@/components/Compose/ComposeActions/PlatformAction.js';
import { ReplyRestrictionAction } from '@/components/Compose/ComposeActions/ReplyRestrictionAction.js';
import { ComposeSend } from '@/components/Compose/ComposeSend.js';
import { SchedulePostEntryButton } from '@/components/Compose/SchedulePostEntryButton.js';
import { GifEntryButton } from '@/components/Gif/GifEntryButton.js';
import { PollButton } from '@/components/Poll/PollButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { DISABLE_REPLY_SETTINGS_POST_SOURCES, ENABLE_SCHEDULE_POST_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { getCurrentPostGifLimits, getCurrentPostImageLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { RedPacketModalRef } from '@/modals/controls.js';
import { useComposeScheduleStateStore } from '@/store/useComposeScheduleStore.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export function ComposeActions() {
    const isMedium = useIsMedium();
    const { ethereum, solana } = useWalletAccountAll();

    const post = useCompositePost();
    const { type, posts } = useComposeStateStore();

    const { availableSources, images, video, poll, rpPayload } = post;

    const { scheduleTime } = useComposeScheduleStateStore();

    const [{ loading }, openRedPacketComposeDialog] = useAsyncFn(async () => {
        if (!ethereum.address && !solana.address) {
            ethereum.connect();
            return;
        }

        RedPacketModalRef.open();
    }, [solana.address, ethereum]);

    const maxImageCount = Math.min(
        getCurrentPostImageLimits(type, availableSources),
        getCurrentPostGifLimits(availableSources),
    );

    const mediaDisabled = !!video || images.length >= maxImageCount || !!poll;
    const scheduleDisabled = availableSources.some((x) => !ENABLE_SCHEDULE_POST_SOURCES.includes(x));

    const hasError = useMemo(() => {
        return posts.some((x) => !!compact(values(x.postError)).length);
    }, [posts]);

    const showFarcasterChannel =
        availableSources.includes(Source.Farcaster) && (type === 'compose' || type === 'quote');

    const showLensChannel = availableSources.includes(Source.Lens) && type === 'compose';

    const showReplyScope =
        type !== 'reply' &&
        !(type === 'quote' && availableSources.includes(Source.Farcaster)) &&
        availableSources.every((x) => !DISABLE_REPLY_SETTINGS_POST_SOURCES.includes(x));

    return (
        <div className="px-4 pb-4">
            <div className="mb-2 flex flex-wrap gap-2">
                <div className="flex items-center gap-x-1 rounded-[6px] border border-secondaryLine p-2">
                    <PlatformAction hasError={hasError} />
                </div>
                {showReplyScope ? (
                    <div className="text-nowrap rounded-[6px] border border-secondaryLine p-2">
                        <ReplyRestrictionAction hasError={hasError} />
                    </div>
                ) : null}

                {showFarcasterChannel ? (
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
                    {env.external.NEXT_PUBLIC_COMPOSE_GIF === STATUS.Enabled ? (
                        <GifEntryButton disabled={mediaDisabled} />
                    ) : null}
                    <EmojiAction />

                    {type === 'compose' && env.external.NEXT_PUBLIC_POLL === STATUS.Enabled ? <PollButton /> : null}

                    {env.external.NEXT_PUBLIC_SCHEDULE_POST === STATUS.Enabled && !rpPayload ? (
                        <Tooltip content={t`Schedule`} placement="top" disabled={scheduleDisabled}>
                            <SchedulePostEntryButton className="text-main" disabled={scheduleDisabled} />
                        </Tooltip>
                    ) : null}

                    {!scheduleTime && !mediaDisabled && isMedium ? (
                        <ClickableButton
                            className={classNames('h-5 w-5', {
                                'cursor-wait opacity-50': loading,
                                'cursor-not-allowed opacity-50': !loading && mediaDisabled,
                                'cursor-pointer': !mediaDisabled,
                            })}
                            onClick={() => {
                                openRedPacketComposeDialog();
                            }}
                        >
                            <RedPacketIcon width={20} height={20} />
                        </ClickableButton>
                    ) : null}
                </div>

                {isMedium ? <ComposeSend /> : <AddThread />}
            </div>
        </div>
    );
}
