import { classNames } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';

import { Image } from '@/esm/Image.js';

export function BaseNotFound(props: HTMLProps<HTMLDivElement>) {
    return (
        <main
            {...props}
            className={classNames(
                'flex flex-[1_1_100%] flex-col border-r border-line md:!pl-0 lg:!pl-0',
                props.className,
            )}
        >
            <div className="flex grow flex-col items-center justify-center">
                <Image src="/image/radar.png" width={200} height={106} alt="Page not found" />
                {props.children}
            </div>
        </main>
    );
}
