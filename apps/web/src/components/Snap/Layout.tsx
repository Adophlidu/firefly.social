import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { memo } from 'react';

import { SnapCard } from '@/components/Snap/Card.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import type { Snap } from '@/types/snap.js';

interface SnapLayoutProps {
    snap: Snap;
    post: Post;
}

export const SnapLayout = memo<SnapLayoutProps>(function SnapLayout({ snap, post }) {
    if (envs.external.NEXT_PUBLIC_SNAP !== STATUS.Enabled) return null;
    return <SnapCard snap={snap} post={post} />;
});
