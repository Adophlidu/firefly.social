import type { SocialSource } from '@dimensiondev/enums';
import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useMemo, useState } from 'react';

import { ChannelCard } from '@/components/Channel/ChannelCard.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { TippyContext, useTippyContext } from '@/components/TippyContext/index.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useRouter } from '@/esm/navigation.js';
import { isChannelNotFoundError } from '@/helpers/isChannelNotFoundError.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useEverSeen } from '@/hooks/useEverSeen.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { Channel } from '@/providers/types/SocialMedia.js';
import { useChannelStoreState } from '@/store/useChannelStore.js';

interface ChannelTagProps {
    title?: string;
    source?: SocialSource;
    id?: string;
}

export const ChannelTag = memo<ChannelTagProps>(function ChannelTag({ title, source, id }) {
    const isMedium = useIsMedium();
    const router = useRouter();
    const channelId = id || title?.trim().slice(1);

    const { allChannelData, addChannel } = useChannelStoreState();
    const [viewed, ref] = useEverSeen<HTMLDivElement>();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (!title || !viewed) return;
        router.prefetch(resolveChannelUrl(title.trim().slice(1), source));
    }, [title, router, source, viewed]);

    const { data, isError, isLoading } = useQuery<Channel | null>({
        enabled: !!channelId && !!source && viewed,
        queryKey: ['channel', source, channelId],
        staleTime: STALE_TIMES.MINUTE_5,

        queryFn: async () => {
            if (!channelId || !source) return null;

            try {
                const provider = resolveSocialMediaProvider(source);
                const result = await provider.getChannelById(channelId);
                const channel = result ?? null;
                addChannel(source, channelId, channel);
                return channel;
            } catch (error) {
                if (!isChannelNotFoundError(error)) {
                    throw error;
                }

                addChannel(source, channelId, null);
                return null;
            }
        },
    });

    const content = useMemo(() => {
        if (!channelId) return;
        return (
            <ClickableArea
                className="cursor-pointer text-highlight hover:underline"
                as="span"
                ref={ref}
                onClick={() => {
                    router.push(resolveChannelUrl(channelId, source));
                }}
            >
                {title}
            </ClickableArea>
        );
    }, [title, channelId, router, source, ref]);

    const insideTippy = useTippyContext();

    if (!channelId || !source) return;

    if (allChannelData[source][channelId] === null || isError) return title;

    if (!isMedium || insideTippy) return content;

    return (
        <TippyContext.Provider value>
            <InteractiveTippy
                maxWidth={350}
                className="tippy-card"
                placement="bottom"
                onTrigger={() => {
                    setEnabled(true);
                }}
                content={enabled ? <ChannelCard loading={isLoading} channel={data} /> : null}
            >
                <span>{content}</span>
            </InteractiveTippy>
        </TippyContext.Provider>
    );
});
