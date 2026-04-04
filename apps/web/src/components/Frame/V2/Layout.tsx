import { memo } from 'react';

import { Card } from '@/components/Frame/V2/Card.js';
import { type Post } from '@/providers/types/SocialMedia.js';
import { type FrameV2 } from '@/types/frame.js';

interface FrameLayoutProps {
    post: Post;
    frame: FrameV2;
}

export const FrameLayout = memo<FrameLayoutProps>(function FrameLayout({ post, frame }) {
    return (
        <div className="pt-2">
            <Card post={post} frame={frame} />
        </div>
    );
});
