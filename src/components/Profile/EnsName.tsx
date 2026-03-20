import type { HTMLProps } from 'react';

interface EnsNameProps extends HTMLProps<HTMLSpanElement> {
    ens: string;
}

export function EnsName({ ens, className }: EnsNameProps) {
    if (!ens) return null;

    const [name, ...rest] = ens.split('.');
    const suffix = rest.length > 0 ? `.${rest.join('.')}` : '';

    return (
        <span className={className}>
            {name}
            <span className="text-second">{suffix}</span>
        </span>
    );
}
