import type { ReactNode } from 'react';

import { SideBar } from '@/components/SideBar/index.js';

/**
 * The perpetuals frame: full-width main column, no right aside, no compose
 * button (same trade-off as the (messages) group — the old (normal) layout's
 * pathname special case, expressed as a group).
 */
export default function PerpetualsLayout({ children }: { children?: ReactNode }) {
    return (
        <div className="m-auto flex w-full md:min-h-screen lg:w-[1265px]">
            <main className="w-full md:pl-[235px] lg:pl-[289px]">{children}</main>
            <SideBar />
        </div>
    );
}
