import { type HTMLProps, memo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { GroupTippy } from '@/components/Group/GroupTippy.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveGroupPageUrl } from '@/helpers/resolveGroupPageUrl.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupAnchorProps extends HTMLProps<HTMLDivElement> {
    group: ProfileGroup;
}

export const GroupAnchor = memo<GroupAnchorProps>(function GroupAnchor({ group, className, onClick, ...rest }) {
    return (
        <div
            {...rest}
            className={classNames(className, 'flex justify-end text-[12px] leading-[16px] text-main')}
            onClick={(event) => {
                event.stopPropagation();
                onClick?.(event);
            }}
        >
            <GroupTippy groupId={group.id} source={group.source} group={group}>
                <Link href={resolveGroupPageUrl(group.id)} className="flex items-center gap-1">
                    {group.imageUrl ? (
                        <Avatar src={group.imageUrl} alt="" size={15} className="size-[15px] rounded-full" />
                    ) : (
                        <SocialSourceIcon className="rounded-full" source={group.source} size={15} />
                    )}
                    <span>#{group.name}</span>
                </Link>
            </GroupTippy>
        </div>
    );
});
