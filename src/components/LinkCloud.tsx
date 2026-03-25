import { IS_PRODUCTION } from '@dimensiondev/constants';
import { envs } from '@dimensiondev/envs';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';

import { Link } from '@/components/Link.js';
import { SITE_URL_OFFICIAL } from '@/constants/static.js';

export function LinkCloud() {
    const links = [
        {
            name: envs.shared.VERSION ? `v${envs.shared.VERSION}` : <Trans>Logs</Trans>,
            link: '/next-debug.log',
            visible: !IS_PRODUCTION,
        },
        { name: <Trans>Communities</Trans>, link: '/settings/more', self: true, visible: true },
        {
            name: <Trans>Feedback</Trans>,
            link: 'https://t.me/fireflyapp',
            visible: true,
        },
        {
            name: <Trans>Privacy Policy</Trans>,
            link: 'https://mask.notion.site/Privacy-Policy-2e903bb2220e4dcfb7c3e8fcbd983d2a',
            visible: true,
        },
        {
            name: <Trans>Terms of Service</Trans>,
            link: 'https://mask.notion.site/Terms-of-Service-bd035d18f7814a79b9d4d7682d9d2d30',
            visible: true,
        },
        {
            name: <Trans>Download App</Trans>,
            link: `${SITE_URL_OFFICIAL}/about`,
            visible: true,
        },
        {
            name: <Trans>About</Trans>,
            link: `${SITE_URL_OFFICIAL}/about`,
            visible: true,
        },
    ];

    return (
        <nav className="flex flex-wrap gap-x-[12px] gap-y-2 px-3 pb-20 text-xs text-second lg:px-0">
            <span className="font-bold text-gray-500">© {2026} Firefly</span>
            {compact(links)
                .filter((item) => item.visible)
                .map(({ name, link, self }, index) =>
                    link ? (
                        <Link
                            key={`${link}${index}`}
                            href={link}
                            className="font-medium outline-offset-4 hover:underline"
                            target={self ? '_self' : '_blank'}
                        >
                            {name}
                        </Link>
                    ) : (
                        <span key={link} className="font-medium">
                            {name}
                        </span>
                    ),
                )}
        </nav>
    );
}
