import type { ReactNode } from 'react';

import { SideBar } from '@/components/SideBar/index.js';

/**
 * The messages frame: full-width main column, no right aside, no compose
 * button (the old (normal) layout's `/messages` special case, expressed as a
 * group instead of a pathname check).
 */
export default function MessagesLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="m-auto flex w-full md:min-h-screen lg:w-[1265px]">
            <main className="w-full md:pl-[235px] lg:pl-[289px]">{children}</main>
            <SideBar />
        </div>
    );
}
