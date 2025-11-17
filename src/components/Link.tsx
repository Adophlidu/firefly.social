'use client';

import { useCallback } from 'react';

import { Link as OriginalLink } from '@/esm/Link.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isSelfReference } from '@/helpers/isLinkMatchingHost.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useInternalLink } from '@/hooks/useInternalLink.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal.js';

type LinkProps = React.ComponentProps<typeof OriginalLink>;

/**
 * Would show a confirmation modal if the link is external and not trusted
 */
export function Link({ href, ref, onClick, ...rest }: LinkProps) {
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
                const confirmed = await ConfirmLeavingModalRef.openAndWaitForClose(href);
                if (confirmed) openWindow(href);
            }
        },
        [onClick, openConfirmModal, href],
    );

    return (
        <OriginalLink
            data-prevent-progress={openConfirmModal}
            {...rest}
            target={internalLink ? (!isSelfReference(internalLink) ? '_blank' : '_self') : rest.target}
            href={internalLink || href}
            ref={ref}
            onClick={onLinkClick}
        />
    );
}
