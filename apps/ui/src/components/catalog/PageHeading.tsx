import type { ReactNode } from 'react';

import { Link } from '#/esm/Link.js';

interface PageHeadingProps {
    title: string;
    description: string;
    children?: ReactNode;
}

export function PageHeading({ title, description, children }: PageHeadingProps) {
    return (
        <div className="mb-12">
            <Link href="/" className="text-sm text-second hover:text-fireflyBrand hover:underline">
                ← All categories
            </Link>
            <h1 className="mt-4 text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-second">{description}</p>
            {children}
        </div>
    );
}
