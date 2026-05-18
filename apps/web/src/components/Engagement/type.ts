import type { SocialSource } from '@dimensiondev/enums';

import type { EngagementType } from '@/constants/enum.js';

export interface PostEngagementListProps {
    postId: string;
    type: EngagementType;
    source: SocialSource;
}
