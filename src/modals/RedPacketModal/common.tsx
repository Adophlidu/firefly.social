import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';

import AddUser from '@/assets/add-user.svg';
import Comment from '@/assets/comment-rp.svg';
import Like from '@/assets/like.svg';
import NFTHolder from '@/assets/nft.svg';
import Repost from '@/assets/repost.svg';
import { RequirementType } from '@/providers/types/FireflyRedPacket.js';

export const REQUIREMENT_TITLE_MAP: Record<RequirementType, ReactNode> = {
    [RequirementType.Follow]: <Trans>Follow me</Trans>,
    [RequirementType.Like]: <Trans id="action-like">Like</Trans>,
    [RequirementType.Repost]: <Trans>Repost</Trans>,
    [RequirementType.Comment]: <Trans>Comment</Trans>,
    [RequirementType.NFTHolder]: <Trans>NFT holder</Trans>,
};

export const REQUIREMENT_ICON_MAP: Record<RequirementType, React.FunctionComponent<React.SVGAttributes<SVGElement>>> = {
    [RequirementType.Follow]: AddUser,
    [RequirementType.Like]: Like,
    [RequirementType.Repost]: Repost,
    [RequirementType.Comment]: Comment,
    [RequirementType.NFTHolder]: NFTHolder,
};
