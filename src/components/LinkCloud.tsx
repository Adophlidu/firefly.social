import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';

import { Link } from '@/components/Link.js';
import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';

export function LinkCloud() {
    return (
        <nav className="flex flex-wrap gap-x-[12px] gap-y-2 px-3 pb-5 text-xs text-second lg:px-0">
            <span className="font-bold text-gray-500">© {2025} Firefly</span>
            {compact([
                { name: <Trans>Communities</Trans>, link: '/settings/more', self: true },
                env.external.NEXT_PUBLIC_DEVELOPERS !== STATUS.Disabled
                    ? { name: <Trans>Developers</Trans>, link: '/developers/general', self: true }
                    : null,
                {
                    name: <Trans>Privacy Policy</Trans>,
                    link: 'https://mask.notion.site/Privacy-Policy-2e903bb2220e4dcfb7c3e8fcbd983d2a',
                },
                {
                    name: <Trans>Terms of Service</Trans>,
                    link: 'https://mask.notion.site/Terms-of-Service-bd035d18f7814a79b9d4d7682d9d2d30',
                },
                {
                    name: <Trans>Download App</Trans>,
                    link: 'https://firefly.social/about',
                },
                {
                    name: <Trans>Feedback</Trans>,
                    link: 'https://t.me/fireflyapp',
                },
                {
                    name: <Trans>About</Trans>,
                    link: 'https://firefly.social/about',
                },
            ]).map(({ name, link, self }) => (
                <Link
                    href={link}
                    key={link}
                    className="font-medium outline-offset-4 hover:underline"
                    target={self ? '_self' : '_blank'}
                >
                    {name}
                </Link>
            ))}
        </nav>
    );
}
