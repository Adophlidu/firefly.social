import type { SnapItemProps } from '@dimensiondev/workers-snap';
import type { ReactNode } from 'react';

import { Image } from '@/components/Image.js';

interface Props {
    props: SnapItemProps;
    onPress?: () => void;
    children?: ReactNode;
}

export function SnapItem({ props: { title, description, imageUrl }, onPress, children }: Props) {
    return (
        <div
            className="flex w-full items-center gap-3 p-2"
            onClick={onPress}
            role={onPress ? 'button' : undefined}
            tabIndex={onPress ? 0 : undefined}
        >
            {imageUrl ? (
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                    <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized sizes="40px" />
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-main">{title}</p>
                {description ? <p className="truncate text-xs text-secondary">{description}</p> : null}
            </div>
            {children ? (
                <div className="flex shrink-0 items-center justify-end gap-1 text-secondary">{children}</div>
            ) : null}
        </div>
    );
}
