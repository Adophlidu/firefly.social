import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';

import { Link } from '@/components/Link.js';
import { SITE_URL_OFFICIAL } from '@/constants/static.js';

export function LinkCloud() {
    return (
        <nav className="flex flex-wrap gap-x-[12px] gap-y-2 px-3 pb-20 text-xs text-second lg:px-0">
            <span className="font-bold text-gray-500">© {2026} Firefly</span>
            {compact([
                { name: <Trans>Communities</Trans>, link: '/settings/more', self: true },

                {
                    name: <Trans>Feedback</Trans>,
                    link: 'https://t.me/fireflyapp',
                },
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
                    link: `${SITE_URL_OFFICIAL}/about`,
                },
                {
                    name: <Trans>About</Trans>,
                    link: `${SITE_URL_OFFICIAL}/about`,
                },
            ]).map(({ name, link, self }, index) => (
                <Link
                    key={`${link}${index}`}
                    href={link}
                    className="font-medium outline-offset-4 hover:underline"
                    target={self ? '_self' : '_blank'}
                >
                    {name}
                </Link>
            ))}
        </nav>
    );
}
