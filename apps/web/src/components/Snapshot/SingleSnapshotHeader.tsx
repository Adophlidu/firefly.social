'use client';

import SnapshotIcon from '@dimensiondev/assets/snapshot.svg';
import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';
import urlcat from 'urlcat';

import { SnapshotMoreAction } from '@/components/Actions/SnapshotMore.js';
import { ActivityCellHeader } from '@/components/ActivityCell/ActivityCellHeader.js';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { SourceInURL } from '@/constants/enum.js';
import { getWalletProfileAvatar } from '@/helpers/getWalletProfileAvatar.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { type SnapshotActivity } from '@/providers/snapshot/type.js';

interface SingleSnapshotHeaderProps {
    data: SnapshotActivity;
    className?: string;
}

export const SingleSnapshotHeader = memo<SingleSnapshotHeaderProps>(function SingleArticleHeader({ data, className }) {
    const authorUrl = urlcat('/profile/:address', {
        address: data.author.id,
        source: SourceInURL.Wallet,
    });

    const { data: ens } = useEnsName(data.author.id, !data.author.handle);

    return (
        <header className={classNames('flex w-full items-start gap-3', className)}>
            <Link href={authorUrl} className="z-1" onClick={(event) => event.stopPropagation()}>
                <Avatar
                    className="size-10"
                    src={getWalletProfileAvatar(data.displayInfo) || data.author.avatar}
                    size={40}
                    alt={data.author.handle || data.author.id}
                />
            </Link>
            <ActivityCellHeader
                className="w-full min-w-0"
                displayName={data.author.handle || ens}
                address={data.author.id}
                time={data.timestamp}
                icon={<SnapshotIcon className="shrink-0" width={16} height={16} />}
            >
                <SnapshotMoreAction data={data} />
            </ActivityCellHeader>
        </header>
    );
});
