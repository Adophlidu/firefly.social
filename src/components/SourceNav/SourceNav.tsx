import { classNames } from '@firefly/utils';
import type { HTMLProps, JSX } from 'react';

import { Link } from '@/components/Link.js';

type SourceNavProps<T> = {
    sources: T[];
    source: T;
    urlResolver: (source: T) => string;
    nameResolver: (source: T) => string | JSX.Element;
} & HTMLProps<HTMLDivElement>;

export function SourceNav<T>({ source, sources, urlResolver, className, nameResolver, ...rest }: SourceNavProps<T>) {
    if (!sources) return null;
    return (
        <nav className={classNames('flex space-x-2 px-1.5 pb-1.5 pt-3', className)} aria-label="Tabs" {...rest}>
            {sources.map((x, index) => (
                <Link
                    key={index}
                    href={urlResolver(x)}
                    replace
                    className={classNames(
                        'flex h-6 cursor-pointer list-none justify-center rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                        source === x ? 'bg-highlight text-white' : 'bg-thirdMain text-second hover:text-highlight',
                    )}
                    aria-current={source === x ? 'page' : undefined}
                >
                    {nameResolver(x)}
                </Link>
            ))}
        </nav>
    );
}
