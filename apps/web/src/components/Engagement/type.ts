import type { EngagementType, SocialSource } from '@dimensiondev/enums';

export interface PostEngagementListProps {
    postId: string;
    type: EngagementType;
    source: SocialSource;
}
