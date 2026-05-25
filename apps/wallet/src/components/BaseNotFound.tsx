import RadarImage from '@dimensiondev/assets/radar.png';
import type { HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { cn } from '@/lib/utils.js';

export function BaseNotFound(props: HTMLProps<HTMLDivElement>) {
    return (
        <main {...props} className={cn('flex flex-[1_1_100%] flex-col border-r border-line', props.className)}>
            <div className="flex grow flex-col items-center justify-center">
                <Image src={RadarImage} width={200} height={106} alt="Page not found" />
                {props.children}
            </div>
        </main>
    );
}
