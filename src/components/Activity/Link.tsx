import type { LinkProps } from 'next/link.js';
import { forwardRef, type HTMLProps, type PropsWithChildren, useCallback } from 'react';
import urlcat from 'urlcat';

import { IS_ANDROID } from '@/constants/bowser.js';
import { Link as OriginalLink } from '@/esm/Link.js';
import { interceptExternalUrl } from '@/helpers/interceptExternalUrl.js';
import { isTrustedUrl } from '@/helpers/isTrustedUrl.js';
import { openWindow } from '@/helpers/openWindow.js';
import { useInternalLink } from '@/hooks/useInternalLink.js';
import { ConfirmLeavingModalRef } from '@/modals/controls.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

export const Link = forwardRef<
    HTMLAnchorElement,
    PropsWithChildren<Omit<LinkProps, 'href'>> & Pick<HTMLProps<'a'>, 'className' | 'target'> & { href: string }
>(function Link({ children, ...props }, ref) {
    const { href } = props;
    const { data: internalLink } = useInternalLink(href);

    const onLinkClick = useCallback(
        async (event: React.MouseEvent<HTMLAnchorElement>) => {
            const isTrusted = isTrustedUrl(href);
            if (!isTrusted && !internalLink && typeof href === 'string') {
                event.preventDefault();
                const intercepted = await interceptExternalUrl(href);
                if (intercepted) return;

                const confirmed = await ConfirmLeavingModalRef.openAndWaitForClose(href);
                if (confirmed) {
                    if (fireflyBridgeProvider.supported) {
                        const url = !props.href.startsWith('https')
                            ? urlcat(window.location.origin, props.href)
                            : props.href;
                        if (!IS_ANDROID) {
                            event.preventDefault();
                            await fireflyBridgeProvider.request(SupportedMethod.OPEN_URL, {
                                url,
                            });
                        }
                    } else {
                        openWindow(props.href);
                    }
                }
                return;
            }
            props.onClick?.(event);
        },
        [props, href, internalLink],
    );

    return (
        <OriginalLink ref={ref} {...props} data-disable-nprogress onClick={onLinkClick}>
            {children}
        </OriginalLink>
    );
});
