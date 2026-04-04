import { memo } from 'react';

import { Embed } from '@/components/Oembed/Embed.js';
import { type LinkDigested } from '@/types/og.js';

export const OembedLayout = memo<{ data: LinkDigested }>(function OembedPayload(props) {
    const { og } = props.data;

    return <Embed og={og} />;
});
