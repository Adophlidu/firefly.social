'use client';

import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ContentCard } from '@/app/[locale]/(settings)/settings/privacy-and-security/pages/ContentCard.js';
import RightArrowIcon from '@/assets/right-arrow.svg';
import { Link } from '@/esm/Link.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useMuteMenuList } from '@/hooks/useMuteMenuList.js';

export const MutedContents = memo(function MutedContents() {
    const menus = useMuteMenuList();

    if (!menus.length) return null;

    return (
        <ContentCard
            label={<Trans>Muted contents</Trans>}
            description={<Trans>Manage the accounts, wallets, and clubs that you’ve muted.</Trans>}
        >
            <div className="w-full">
                {menus.map((menu) => (
                    <Link
                        className="mt-4 flex h-6 items-center justify-between text-base text-main"
                        key={`${menu.source}-${menu.type}`}
                        href={`/settings/mutes/${resolveSourceInUrl(menu.source)}/${menu.type}`}
                    >
                        <span>{menu.name}</span>
                        <RightArrowIcon width={24} height={24} />
                    </Link>
                ))}
            </div>
        </ContentCard>
    );
});
