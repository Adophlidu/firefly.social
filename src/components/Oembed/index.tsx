import { memo } from 'react';

import { Embed } from '@/components/Oembed/Embed.js';
import { Player } from '@/components/Oembed/Player.js';
import { isLinkMatchingHost } from '@/helpers/isLinkMatchingHost.js';
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
