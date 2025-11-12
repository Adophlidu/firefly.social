import { createLookupTableResolver } from '@dimensiondev/utils';
import { type FunctionComponent, type SVGAttributes } from 'react';

import CollectIcon from '@/assets/collect-large.svg';
import FollowIcon from '@/assets/follow.svg';
import LikeIcon from '@/assets/like-large.svg';
import MessagesIcon from '@/assets/message2.svg';
import MirrorIcon from '@/assets/mirror-large.svg';
import ScheduleIcon from '@/assets/schedule.svg';
import TipsIcon from '@/assets/tips.svg';
import { NotificationType } from '@/providers/types/SocialMedia.js';

export const resolveNotificationIcon = createLookupTableResolver<
    NotificationType,
    FunctionComponent<SVGAttributes<SVGElement>> | null
>(
    {
        [NotificationType.Reaction]: LikeIcon,
        [NotificationType.Act]: CollectIcon,
        [NotificationType.Comment]: MessagesIcon,
        [NotificationType.Mirror]: MirrorIcon,
        [NotificationType.Quote]: MirrorIcon,
        [NotificationType.Follow]: FollowIcon,
        [NotificationType.Mention]: MessagesIcon,
        [NotificationType.Tips]: TipsIcon,
        [NotificationType.Schedule]: ScheduleIcon,
        [NotificationType.LikeMatters]: LikeIcon,
        [NotificationType.LikeMirror]: LikeIcon,
        [NotificationType.LikeParagraph]: LikeIcon,
        [NotificationType.LikeLimo]: LikeIcon,
        [NotificationType.LikeBets]: LikeIcon,
        [NotificationType.LikeDAO]: LikeIcon,
        [NotificationType.LikeNFT]: LikeIcon,
    },
    null,
);
