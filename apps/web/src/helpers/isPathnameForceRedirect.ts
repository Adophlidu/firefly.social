import { PageRoute } from '@/constants/enum.js';

export function isPathnameForceRedirect(pathname: string): boolean {
    return [PageRoute.Home, PageRoute.FollowingPosts, PageRoute.DiscoverPosts].includes(pathname as PageRoute);
}
