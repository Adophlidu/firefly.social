import { safeUnreachable } from '@firefly/utils';
import type { ReactNode } from 'react';

import { FrameLayout as FrameLayoutV1 } from '@/components/Frame/V1/Layout.js';
import { FrameLayout as FrameLayoutV2 } from '@/components/Frame/V2/Layout.js';
import { Oembed } from '@/components/Oembed/index.js';
import { FrameProtocol, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { isFrameV1, isFrameV2 } from '@/helpers/frame.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Frame } from '@/types/frame.js';

interface FrameLayoutProps {
    frame: Frame;
    post: Post;
    children?: ReactNode;
}

export function FrameLayout({ frame, post, children }: FrameLayoutProps) {
    switch (post.source) {
        case Source.Farcaster:
            break;
        case Source.Lens:
            if (!isFrameV1(frame) || frame.protocol !== FrameProtocol.OpenFrame) return <Oembed post={post} />;
            break;
        case Source.Twitter:
            return <Oembed post={post} />;
        case Source.Bsky:
            return <Oembed post={post} />;
        default:
            safeUnreachable(post.source);
            break;
    }

    if (isFrameV2(frame) && env.external.NEXT_PUBLIC_FRAME_V2 === STATUS.Enabled) {
        return <FrameLayoutV2 frame={frame} post={post} />;
    }

    if (isFrameV1(frame) && env.external.NEXT_PUBLIC_FRAME_V1 === STATUS.Enabled) {
        return (
            <FrameLayoutV1 frame={frame} post={post}>
                {children}
            </FrameLayoutV1>
        );
    }

    return null;
}
