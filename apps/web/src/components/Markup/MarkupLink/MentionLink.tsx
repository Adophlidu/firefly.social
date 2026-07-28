'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Link } from '@/components/Link.js';
import type { LinkProps } from '@/esm/Link.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

interface Props extends LinkProps {
    handle: string;
    displayHandle?: string;
    className?: string;
    ref?: React.Ref<HTMLAnchorElement>;
}

export const MentionLink = memo<Props>(function MentionLink({ handle, displayHandle, className, ref, ...rest }) {
    if (!handle) return null;
    return (
        <Link className={classNames('text-highlight', className)} {...rest} onClick={stopPropagation} ref={ref}>
            @{displayHandle || handle}
        </Link>
    );
});
