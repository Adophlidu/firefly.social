import type { LinkProps } from 'next/link.js';
import { type HTMLProps, type PropsWithChildren, useCallback } from 'react';

import { Link as OriginalLink } from '@/esm/Link.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openUrl } from '@/helpers/openUrl.js';
import { useInternalLink } from '@/hooks/useInternalLink.js';
import { ConfirmLeavingModalRef } from '@/modals/ConfirmLeavingModal.js';

type Props = PropsWithChildren<Omit<LinkProps, 'href'>> &
    Pick<HTMLProps<HTMLAnchorElement>, 'className' | 'target' | 'ref'> & { href: string } & {
        trusted?: boolean;
    };

export function Link({ children, ref, trusted = false, ...props }: Props) {
    const { href } = props;
    const { data: internalLink } = useInternalLink(href);

    const onLinkClick = useCallback(
        async (event: React.MouseEvent<HTMLAnchorElement>) => {
            event.preventDefault();
            const isTrusted = isTrustedUrl(href);
            if (!trusted && !isTrusted && !internalLink && typeof href === 'string') {
                const intercepted = await interceptExternalUrl(href);
                if (intercepted) return;
                const confirmed = await ConfirmLeavingModalRef.openAndWaitForClose(href);
                if (!confirmed) return;
            }
            await openUrl(props.href);
            props.onClick?.(event);
        },
        [href, trusted, internalLink, props],
    );

    return (
        <OriginalLink ref={ref} {...props} onClick={onLinkClick}>
            {children}
        </OriginalLink>
    );
}
