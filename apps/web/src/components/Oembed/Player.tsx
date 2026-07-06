import { classNames } from '@dimensiondev/utils';
import { memo, useMemo } from 'react';

import { parseEmbedPlayerIframe } from '@/helpers/parseEmbedPlayerIframe.js';

interface PlayerProps {
    html: string;
    isSpotify?: boolean;
}

export const Player = memo<PlayerProps>(function Player({ html, isSpotify = false }) {
    const iframe = useMemo(() => parseEmbedPlayerIframe(html), [html]);

    if (!iframe) return null;

    return (
        <div className="mt-4 w-full max-w-full text-sm">
            <div className={classNames('oembed-player', { 'spotify-player': isSpotify })}>
                <iframe
                    src={iframe.src}
                    width="100%"
                    height={iframe.height}
                    allow={iframe.allow}
                    allowFullScreen={iframe.allowFullScreen}
                    referrerPolicy={
                        iframe.referrerPolicy as React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy']
                    }
                    className="w-full border-0"
                    title="Embedded media player"
                />
            </div>
        </div>
    );
});
