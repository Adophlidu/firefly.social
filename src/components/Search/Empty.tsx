'use client';

import { Trans } from '@lingui/react/macro';
import { type ReactNode } from 'react';

interface EmptyProps {
    keyword: string;
    message?: ReactNode;
}

export function Empty({ keyword, message }: EmptyProps) {
    return (
        <div className="mx-16">
            <div className="text-sm text-main">
                <Trans>No results for &quot;{keyword}&quot;</Trans>
            </div>
            <p className="mt-4 text-center text-sm text-second">
                {message || <Trans>Try searching for something else.</Trans>}
            </p>
        </div>
    );
}
