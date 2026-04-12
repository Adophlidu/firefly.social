'use client';

import { Trans } from '@lingui/react/macro';
import type { ReactNode } from 'react';

interface EmptyProps {
    keyword: string;
    message?: ReactNode;
}

export function Empty({ keyword, message }: EmptyProps) {
    return (
        <div className="mx-16">
            <div className="text-main text-sm">
                <Trans>No results for &quot;{keyword}&quot;</Trans>
            </div>
            <p className="text-second mt-4 text-center text-sm">
                {message || <Trans>Try searching for something else.</Trans>}
            </p>
        </div>
    );
}
