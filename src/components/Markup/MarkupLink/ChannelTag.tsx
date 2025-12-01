import { useQuery } from '@tanstack/react-query';
import { memo, useEffect, useMemo, useState } from 'react';

import { ChannelCard } from '@/components/Channel/ChannelCard.js';
import { ClickableArea } from '@/components/ClickableArea.js';
import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { TippyContext, useTippyContext } from '@/components/TippyContext/index.js';
import type { SocialSource } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { resolveChannelUrl } from '@/helpers/resolveChannelUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useEverSeen } from '@/hooks/useEverSeen.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
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

    const data = useQuery({
        enabled: !!channelId && !!source && viewed,
        queryKey: ['channel', source, channelId],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            if (!channelId || !source) return;
            try {
                const provider = resolveSocialMediaProvider(source);
                const result = await provider.getChannelById(channelId);
                addChannel(source, channelId, result ? result : null);
                return result;
            } catch {
                addChannel(source, channelId, null);
                return;
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

    if (allChannelData[source][channelId] === null) return title;

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
                content={enabled ? <ChannelCard loading={data.isLoading} channel={data.data} /> : null}
            >
                <span>{content}</span>
            </InteractiveTippy>
        </TippyContext.Provider>
    );
});
