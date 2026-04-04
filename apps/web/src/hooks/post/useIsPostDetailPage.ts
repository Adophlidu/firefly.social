import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';

export function useIsPostDetailPage() {
    const pathname = usePathname();
    return isRoutePathname(pathname, PageRoute.PostDetail, true);
}
