'use client';

import { Trans } from '@lingui/react/macro';

import { TextLink } from '@/app/(settings)/components/TextLink.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useMuteMenuList } from '@/hooks/useMuteMenuList.js';

export default function Page() {
    const menus = useMuteMenuList();

    return (
        <div className="p-6 md:min-w-[280px]">
            <div className="hidden pb-6 text-[20px] font-bold leading-[24px] text-lightMain md:block">
                <Trans>Muted contents</Trans>
            </div>
            <div>
                {menus.map((menu) => (
                    <TextLink
                        key={`${menu.source}-${menu.type}`}
                        name={menu.name}
                        link={`/settings/mutes/${resolveSourceInUrl(menu.source)}/${menu.type}`}
                    />
                ))}
            </div>
        </div>
    );
}
