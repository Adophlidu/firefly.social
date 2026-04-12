import { classNames } from '@dimensiondev/utils';
import type { ReactNode } from 'react';

import { Link } from '@/components/Link.js';

interface SecondTabsProps<T extends keyof any> {
    items: Array<{
        title: ReactNode;
        link: string;
        value: T;
    }>;
    current: T;
}

export function SecondTabs<T extends keyof any>({ items, current }: SecondTabsProps<T>) {
    return (
        <nav className="border-line bg-primaryBottom border-b">
            <menu className="scrollable-tab -mb-px flex gap-1.5 px-4 md:w-full" aria-label="Tabs">
                {items.map((tab) => {
                    return (
                        <li key={tab.link} className="flex flex-1 list-none justify-center">
                            <Link
                                replace
                                href={tab.link}
                                className={classNames(
                                    current === tab.value ? 'border-highlight text-highlight border-b-4' : 'text-third',
                                    'hover:text-highlight h-[45px] whitespace-nowrap px-4 text-center text-base font-bold leading-[45px] hover:cursor-pointer',
                                )}
                            >
                                {tab.title}
                            </Link>
                        </li>
                    );
                })}
            </menu>
        </nav>
    );
}
