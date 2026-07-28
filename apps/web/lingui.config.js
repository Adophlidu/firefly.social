import { formatter } from '@lingui/format-po-gettext';

const locales = ['en', 'es', 'ko', 'ja', 'zh-Hans', 'zh-Hant'];

/** @type {import('@lingui/conf').LinguiConfig} */
export default {
    locales,
    sourceLocale: 'en',
    compileNamespace: 'ts',
    catalogs: [
        {
            path: 'src/locales/{locale}/messages',
            include: [
                'src/legacy/**',
                'src/configs/**',
                'src/components/**',
                'src/constants/**',
                'src/connectors/**',
                'src/helpers/**',
                'src/hooks/**',
                'src/providers/**',
                'src/modals/**',
                'src/store/**',
                'src/services/**',
                'src/mask/**',
            ],
        },
    ],
    orderBy: 'messageId',
    format: formatter({
        origins: false,
        lineNumbers: false,
        disableSelectWarning: true,
        mergePlurals: false,
    }),
};
