import CollectIcon from '@dimensiondev/assets/collect-large.svg';
import FollowIcon from '@dimensiondev/assets/follow.svg';
import LikeIcon from '@dimensiondev/assets/like-large.svg';
import MessagesIcon from '@dimensiondev/assets/message2.svg';
import MirrorIcon from '@dimensiondev/assets/mirror-large.svg';
import ScheduleIcon from '@dimensiondev/assets/schedule.svg';
import TipsIcon from '@dimensiondev/assets/tips.svg';
import { NotificationType } from '@dimensiondev/enums';
import { createLookupTableResolver } from '@dimensiondev/utils';
import type { FunctionComponent, SVGAttributes } from 'react';

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
