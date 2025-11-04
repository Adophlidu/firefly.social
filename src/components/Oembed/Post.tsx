import { useSuspenseQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { Quote } from '@/components/Posts/Quote.js';
import { type SocialSourceInURL, Source } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { farcasterSessionHolder } from '@/providers/farcaster/SessionHolder.js';
import { getPostByShortId } from '@/providers/firefly/endpoints/getPostByShortId.js';
import { useImpressionsStore } from '@/store/useImpressionsStore.js';

interface PostEmbedProps {
    id: string;
    source: SocialSourceInURL;
    isInCompose?: boolean;
    handle?: string;
}

export const PostEmbed = memo<PostEmbedProps>(function PostEmbed({ id, source, isInCompose, handle }) {
    const currentSource = resolveSocialSource(source);
    const fetchAndStoreViews = useImpressionsStore.use.fetchAndStoreViews();

    const { data } = useSuspenseQuery({
        queryKey: [currentSource, 'post-detail', id, handle],
        queryFn: async () => {
            if (!id) return null;

            try {
                const provider = resolveSocialMediaProvider(currentSource);
                let post;
                if (currentSource === Source.Farcaster && handle && id.length <= 10) {
                    post = await getPostByShortId(id, handle, farcasterSessionHolder.session?.profileId);
                } else {
                    post = await provider.getPostById(id);
                }
                if (currentSource === Source.Lens) fetchAndStoreViews([post.postId]);
                return post;
            } catch {
                return null;
            }
        },
    });

    if (!data) return;

    return <Quote post={data} isInCompose={isInCompose} />;
});
