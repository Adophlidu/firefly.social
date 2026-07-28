import { type HTMLProps, type PropsWithChildren, useCallback } from 'react';

import { openAndWaitForCloseConfirmLeavingModal } from '@/controllers/openConfirmLeavingModal.js';
import type { LinkProps } from '@/esm/Link.js';
import { Link as OriginalLink } from '@/esm/Link.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openUrl } from '@/helpers/openUrl.js';
import { useInternalLink } from '@/hooks/useInternalLink.js';

type Props = PropsWithChildren<Omit<LinkProps, 'href'>> &
    Pick<HTMLProps<HTMLAnchorElement>, 'className' | 'target'> & { href: string } & {
        trusted?: boolean;
    };

export function Link({ children, trusted = false, href, onClick, ...rest }: Props) {
    const { data: internalLink } = useInternalLink(href);

    const onLinkClick = useCallback(
        async (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            const isTrusted = isTrustedUrl(href);
            if (!trusted && !isTrusted && !internalLink && typeof href === 'string') {
                const intercepted = await interceptExternalUrl(href);
                if (intercepted) return;
                const confirmed = await openAndWaitForCloseConfirmLeavingModal(href);
                if (!confirmed) return;
            }
            await openUrl(href);
            onClick?.(event);
        },
        [href, trusted, internalLink, onClick],
    );

    return (
        <OriginalLink {...rest} href={href} onClick={onLinkClick}>
            {children}
        </OriginalLink>
    );
}
