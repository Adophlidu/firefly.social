import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { GroupInfo } from '@/app/(normal)/group/[id]/[type]/pages/GroupInfo.js';
import { GroupPageProvider } from '@/components/Group/GroupPageProvider.js';
import { Title } from '@/components/Group/Title.js';
import { Link } from '@/components/Link.js';
import { NoSSR } from '@/components/NoSSR.js';
import { GroupTabType } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveGroupPageUrl } from '@/helpers/resolveGroupPageUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';

type GroupDetailsProps = PropsWithChildren<{
    id: string;
    type: GroupTabType;
}>;

export async function GroupDetails({ id, type: currentType, children }: GroupDetailsProps) {
    const group = await runInSafeAsync(() => LensSocialMediaProvider.getGroupById(id));

    if (!group) notFound();

    return (
        <>
            <Title group={group} />
            <hr className="divider w-full border-line" />
            <GroupInfo group={group} />
            <hr className="divider w-full border-line" />
            <nav className="scrollable-tab flex justify-evenly border-b border-line px-5">
                {[
                    { type: GroupTabType.Posts, label: <Trans>Posts</Trans> },
                    { type: GroupTabType.Members, label: <Trans>Members</Trans> },
                ].map(({ type, label }) => (
                    <div className="flex flex-col" key={type}>
                        <Link
                            className={classNames(
                                'flex h-[55px] items-center px-[14px] font-extrabold transition-all',
                                currentType === type ? 'text-main' : 'text-third hover:text-main',
                            )}
                            href={resolveGroupPageUrl(id, type)}
                        >
                            {label}
                        </Link>
                        <span
                            className={classNames(
                                'h-1 w-full rounded-full bg-fireflyBrand transition-all',
                                currentType !== type ? 'hidden' : '',
                            )}
                        />
                    </div>
                ))}
            </nav>
            <NoSSR>
                <GroupPageProvider group={group}>{children}</GroupPageProvider>
            </NoSSR>
        </>
    );
}
