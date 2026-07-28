import type { MuteType } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';

import { MutedListPage } from '@/legacy/[locale]/(settings)/settings/mutes/[source]/[type]/pages/MutedListPage.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { useMuteMenuList } from '@/hooks/useMuteMenuList.js';

export default function MutedSourceTypePage() {
    const { source, type } = useParams();

    const muteMenuList = useMuteMenuList();
    const currentMenu = muteMenuList.find((menu) => menu.type === type && resolveSourceInUrl(menu.source) === source);
    if (!currentMenu || currentMenu.shouldHide()) return null;

    return <MutedListPage name={currentMenu.name} type={type as MuteType} source={currentMenu.source} />;
}
