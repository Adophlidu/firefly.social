'use client';

import { Trans } from '@lingui/react/macro';

import { SettingsSection } from '@/app/(settings)/components/Section.js';
import { TextLink } from '@/app/(settings)/components/TextLink.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useMuteMenuList } from '@/hooks/useMuteMenuList.js';

export default function Page() {
    const menus = useMuteMenuList();

    return (
        <SettingsSection title={<Trans>Muted contents</Trans>}>
            <div className="w-full">
                {menus.map((menu) => (
                    <TextLink
                        key={`${menu.source}-${menu.type}`}
                        name={menu.name}
                        link={`/settings/mutes/${resolveSourceInUrl(menu.source)}/${menu.type}`}
                    />
                ))}
            </div>
        </SettingsSection>
    );
}
