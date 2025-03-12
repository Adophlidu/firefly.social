'use client';

import { useCallback } from 'react';

import { Link as OriginalLink } from '@/esm/Link.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useInternalLink } from '@/hooks/useInternalLink.js';
import { ConfirmLeavingModalRef } from '@/modals/controls.js';

type LinkProps = React.ComponentProps<typeof OriginalLink>;

export function Link({ href, ref, onClick, ...rest }: LinkProps) {
    const { data: internalLink } = useInternalLink(href);

    const onLinkClick = useCallback(
        async (event: React.MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);
            const isTrusted = isTrustedUrl(href);
            if (!isTrusted && !internalLink && typeof href === 'string') {
                event.preventDefault();
                const intercepted = await interceptExternalUrl(href);
                if (intercepted) return;

                const confirmed = await ConfirmLeavingModalRef.openAndWaitForClose(href);
                if (confirmed) {
                    openWindow(href);
                }
            }
        },
        [internalLink, href, onClick],
    );

    return <OriginalLink {...rest} href={internalLink || href} ref={ref} onClick={onLinkClick} />;
}
