import { type HTMLProps, memo } from 'react';

import { GroupCard } from '@/components/Group/GroupCard.js';
import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import type { SocialSource } from '@/constants/enum.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupTippyProps extends HTMLProps<HTMLDivElement> {
    groupId: string;
    source: SocialSource;
    group?: ProfileGroup;
}

export const GroupTippy = memo<GroupTippyProps>(function GroupTippy({ groupId, group, source, ...rest }) {
    const isMedium = useIsMedium();

    if (!isMedium) return rest.children;

    return (
        <InteractiveTippy
            appendTo={() => document.body}
            offset={[100, 0]}
            maxWidth={350}
            className="tippy-card"
            placement="bottom-end"
            content={<GroupCard groupId={groupId} group={group} source={source} />}
        >
            <div {...rest} />
        </InteractiveTippy>
    );
});
