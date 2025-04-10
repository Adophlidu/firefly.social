import { Trans } from '@lingui/react/macro';
import { type HTMLProps } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { GroupMembersCount } from '@/components/Group/GroupMembersCount.js';
import { GroupToggleJoinButton } from '@/components/Group/GroupToggleJoinButton.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { isZeroAddressEthereum } from '@/helpers/isZeroAddress.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupInfoProps extends HTMLProps<HTMLDivElement> {
    group: ProfileGroup;
}

export async function GroupInfo({ group, ...rest }: GroupInfoProps) {
    const isZero = isZeroAddressEthereum(group.ownerProfileId);
    const ownerProfile =
        group.ownerProfileId && !isZero
            ? await runInSafeAsync(() => LensSocialMediaProvider.getProfileById(group.ownerProfileId!))
            : undefined;

    return (
        <article {...rest} className={classNames('flex gap-3 p-3', rest.className)}>
            {group.imageUrl ? (
                <Avatar src={group.imageUrl} alt="avatar" size={48} className="size-12 rounded-full" />
            ) : (
                <SocialSourceIcon className="rounded-full" source={group.source} size={48} />
            )}

            <div className="relative flex flex-1 flex-col gap-[6px]">
                <GroupToggleJoinButton className="absolute right-0 top-0" group={group} />
                <div className="flex flex-col">
                    <h1 className="flex items-center gap-2">
                        <span className="text-lg font-black leading-6 text-lightMain">{group.name}</span>
                        <SocialSourceIcon mono source={group.source} size={20} />
                    </h1>
                </div>

                {ownerProfile || isZero ? (
                    <div className="flex flex-row items-center gap-1">
                        <span className="text-medium text-secondary">
                            <Trans>By @{ownerProfile?.handle || 'Unknown'}</Trans>
                        </span>
                        <GroupMembersCount groupId={group.id} />
                    </div>
                ) : null}

                <BioMarkup className={classNames('text-medium max-md:-ml-[60px]')} source={group.source}>
                    {group.description ?? '-'}
                </BioMarkup>
            </div>
        </article>
    );
}
