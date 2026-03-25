import { classNames } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';

interface EnsNameProps extends HTMLProps<HTMLSpanElement> {
    ens: string;
}

export function EnsName({ ens, className }: EnsNameProps) {
    if (!ens) return null;

    const [name, ...rest] = ens.split('.');
    const suffix = rest.length > 0 ? `.${rest.join('.')}` : '';

    return (
        <span className={classNames('flex w-full min-w-0', className)}>
            <span className="min-w-0 truncate">{name}</span>
            <span className="shrink-0 text-second">{suffix}</span>
        </span>
    );
}
