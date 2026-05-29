'use client';

import { forwardRef, useCallback } from 'react';

import { Link as OriginalLink } from '@/esm/Link.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isSelfReference } from '@/helpers/isLinkMatchingHost.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openAndWaitForCloseConfirmLeavingModal } from '@/helpers/openConfirmLeavingModal.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useInternalLink } from '@/hooks/useInternalLink.js';

type LinkProps = React.ComponentProps<typeof OriginalLink>;

/**
 * Would show a confirmation modal if the link is external and not trusted
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, onClick, ...rest }, ref) {
    const { data: internalLink } = useInternalLink(href);
    const isTrusted = isTrustedUrl(href);
    const openConfirmModal = !isTrusted && !internalLink && typeof href === 'string';

    const onLinkClick = useCallback(
        async (event: React.MouseEvent<HTMLAnchorElement>) => {
            onClick?.(event);
            if (openConfirmModal) {
                event.preventDefault();
                const intercepted = await interceptExternalUrl(href);
                if (intercepted) return;
                const confirmed = await openAndWaitForCloseConfirmLeavingModal(href);
                if (confirmed) openWindow(href);
            }
        },
        [onClick, openConfirmModal, href],
    );

    return (
        <OriginalLink
            ref={ref}
            data-prevent-progress={openConfirmModal}
            {...rest}
            target={internalLink ? (!isSelfReference(internalLink) ? '_blank' : '_self') : rest.target}
            href={internalLink || href}
            onClick={onLinkClick}
        />
    );
});
