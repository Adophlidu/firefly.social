
import DiscordIcon from '@dimensiondev/assets/discord.svg';
import DocumentsIcon from '@dimensiondev/assets/documents.svg';
import MaskRoundIcon from '@dimensiondev/assets/mask.round.svg';
import SecurityIcon from '@dimensiondev/assets/security.svg';
import TelegramIcon from '@dimensiondev/assets/telegram.svg';
import { FIREFLY_TELEGRAM_URL } from '@dimensiondev/constants/static';
import { Trans } from '@lingui/react/macro';

import { DocumentCard } from '@/app/[locale]/(settings)/components/DocumentCard.js';
import { LinkCard } from '@/app/[locale]/(settings)/components/LinkCard.js';
import { SettingsSection } from '@/app/[locale]/(settings)/components/Section.js';
import { Subtitle } from '@/app/[locale]/(settings)/components/Subtitle.js';
import { XIcon } from '@/components/XIcon.js';

function SmallXIcon() {
    return (
        <div className="flex size-6 items-center justify-center">
            <XIcon width={23} height={23} />
        </div>
    );
}

export default function More() {
    return (
        <SettingsSection title={<Trans>More</Trans>}>
            <div className="flex w-full flex-col gap-4">
                {[
                    {
                        href: 'https://mask.notion.site/Privacy-Policy-2e903bb2220e4dcfb7c3e8fcbd983d2a',
                        title: <Trans>Privacy Policy</Trans>,
                        icon: <SecurityIcon width={24} height={24} />,
                    },
                    {
                        href: 'https://mask.notion.site/Terms-of-Service-bd035d18f7814a79b9d4d7682d9d2d30',
                        title: <Trans>Terms of Service</Trans>,
                        icon: <DocumentsIcon width={24} height={24} />,
                    },
                ].map((document) => (
                    <DocumentCard key={document.href} {...document} />
                ))}
            </div>

            <Subtitle>
                <Trans>Firefly</Trans>
            </Subtitle>

            <div className="flex w-full flex-col gap-4">
                {[
                    {
                        title: <Trans>Follow @thefireflyapp on X</Trans>,
                        link: '/profile/x/thefireflyapp',
                        logo: SmallXIcon,
                    },
                    {
                        title: <Trans>Follow @fireflyappcn on X</Trans>,
                        link: '/profile/x/fireflyappcn',
                        logo: SmallXIcon,
                    },
                    {
                        title: <Trans>Join our Telegram</Trans>,
                        link: FIREFLY_TELEGRAM_URL,
                        logo: TelegramIcon,
                    },
                ].map(({ title, link, logo }) => (
                    <LinkCard key={link} title={title} link={link} logo={logo} />
                ))}
            </div>

            <Subtitle>
                <Trans>Mask Network</Trans>
            </Subtitle>

            <div className="flex w-full flex-col gap-4">
                {[
                    {
                        title: <Trans>Follow @masknetwork on X</Trans>,
                        link: '/profile/x/masknetwork',
                        logo: SmallXIcon,
                    },
                    {
                        title: <Trans>Visit mask.io</Trans>,
                        link: 'https://mask.io',
                        logo: MaskRoundIcon,
                    },
                    {
                        title: <Trans>Join our Discord</Trans>,
                        link: 'https://discord.com/invite/4SVXvj7',
                        logo: DiscordIcon,
                    },
                    {
                        title: <Trans>Join our Telegram</Trans>,
                        link: 'https://t.me/maskbook_group#telegram',
                        logo: TelegramIcon,
                    },
                ].map(({ title, link, logo }) => (
                    <LinkCard key={link} title={title} link={link} logo={logo} />
                ))}
            </div>
        </SettingsSection>
    );
}
