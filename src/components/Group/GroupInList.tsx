import type { HTMLProps } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { PlainParagraph } from '@/components/Markup/overrides.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveGroupPageUrl } from '@/helpers/resolveGroupPageUrl.js';
import { useIsSmall } from '@/hooks/useMediaQuery.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupInListProps extends HTMLProps<HTMLDivElement> {
    group: ProfileGroup;
    dense?: boolean;
    avatarSize?: number;
}

const overrideComponents = {
    p: PlainParagraph,
    // br: VoidLineBreak,
};

export function GroupInList({ group, dense = false, className, onClick }: GroupInListProps) {
    const isSmall = useIsSmall('max');

    const avatarSize = isSmall || dense ? 40 : 44;

    return (
        <div
            className={classNames(
                'flex-start flex cursor-pointer overflow-auto border-b-lightLineSecond hover:bg-bg dark:border-line',
                {
                    'border-b p-3': !dense,
                    'px-4 py-2': dense,
                },
                className,
            )}
            onClick={onClick}
        >
            <Link className="flex-start flex flex-1 items-center overflow-auto" href={resolveGroupPageUrl(group.id)}>
                <div className="mr-[10px] shrink-0 self-start">
                    {!group.imageUrl ? (
                        <SocialSourceIcon className="rounded-full" source={group.source} size={avatarSize} />
                    ) : (
                        <Avatar
                            className="rounded-full border"
                            src={group.imageUrl}
                            size={avatarSize}
                            alt={group.name}
                        />
                    )}
                </div>

                <div className="flex-start flex max-w-[calc(100%-40px-16px)] flex-1 flex-col overflow-auto">
                    <div className="flex-start flex items-center gap-1 text-sm font-bold leading-5">
                        <span className="mr-1 truncate text-[18px] leading-6">{group.name}</span>
                        <SocialSourceIcon
                            mono
                            source={group.source}
                            size={16}
                            className="flex-shrink-0 text-secondary"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-medium text-sm leading-[24px] text-secondary">
                        <p className="truncate text-[15px] leading-[22px]">/{group.id}</p>
                        <span className="leading-[22px] text-secondary">·</span>
                    </div>
                    {!dense && group.description ? (
                        <BioMarkup
                            className="mt-1.5 line-clamp-2 text-sm"
                            components={overrideComponents}
                            source={group.source}
                        >
                            {group.description ?? '-'}
                        </BioMarkup>
                    ) : null}
                </div>
            </Link>
        </div>
    );
}
