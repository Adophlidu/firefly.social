import { useQuery } from '@tanstack/react-query';
import { memo, useEffect } from 'react';

import { Embed } from '@/components/Oembed/Embed.js';
import { Player } from '@/components/Oembed/Player.js';
import { isLinkMatchingHost } from '@/helpers/isLinkMatchingHost.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { getPostOembed } from '@/services/getPostOembed.js';
import { type LinkDigested, type OpenGraph } from '@/types/og.js';

interface OembedUIProps {
    og: OpenGraph;
}

const OembedUI = memo<OembedUIProps>(function OembedUI({ og }) {
    return og.html ? (
        <Player html={og.html} isSpotify={isLinkMatchingHost(og.url, 'open.spotify.com', false)} />
    ) : (
        <Embed og={og} />
    );
});

export const OembedLayout = memo<{ data: LinkDigested }>(function OembedPayload(props) {
    const { og } = props.data;

    if (!og.title) return null;
    return <OembedUI og={og} />;
});

interface OembedProps {
    post: Post;
    onData?: (data: OpenGraph) => void;
}

export const Oembed = memo<OembedProps>(function Oembed({ post, onData }) {
    const url = post.metadata.content?.oembedUrl;
    const {
        data: oembed,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['oembed', url, post],
        queryFn: () => (url ? getPostOembed(url, post) : null),
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: !!url,
    });

    useEffect(() => {
        if (oembed?.og) onData?.(oembed.og);
    }, [oembed, onData]);

    if (isLoading || error || !oembed?.og) return null;

    return <OembedLayout data={oembed} />;
});
