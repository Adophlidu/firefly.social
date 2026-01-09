'use client';

import { use } from 'react';

import { MutedListPage } from '@/app/(settings)/settings/mutes/[source]/[type]/pages/MutedListPage.js';
import { type MuteType, type SourceInURL } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useMuteMenuList } from '@/hooks/useMuteMenuList.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: SourceInURL; type: MuteType }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const { source, type } = params;

    const muteMenuList = useMuteMenuList();
    const currentMenu = muteMenuList.find((menu) => menu.type === type && resolveSourceInUrl(menu.source) === source);
    if (!currentMenu || currentMenu.shouldHide()) return null;

    return <MutedListPage name={currentMenu.name} type={type} source={currentMenu.source} />;
}
