'use client';

import EyeSlash from '@dimensiondev/assets/eye-slash.svg';
import TrashIcon from '@dimensiondev/assets/trash.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps } from 'react';

interface Props extends HTMLProps<HTMLDivElement> {
    authorMuted?: boolean;
    isQuote: boolean;
}

export function CollapsedContent({ isQuote, authorMuted: muted, ...rest }: Props) {
    return (
        <div {...rest}>
            <div
                className={classNames(
                    'flex items-center gap-1 rounded-lg border-primaryMain py-[6px] text-medium',
                    isQuote ? '' : 'border px-3',
                )}
            >
                {muted ? <EyeSlash width={16} height={16} /> : <TrashIcon width={16} height={16} />}
                {muted ? <Trans>The author is muted by you.</Trans> : <Trans>Post has been deleted</Trans>}
            </div>
        </div>
    );
}
