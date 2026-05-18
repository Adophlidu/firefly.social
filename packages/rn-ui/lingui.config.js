import { formatter } from '@lingui/format-po-gettext';

const locales = ['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant'];

/** @type {import('@lingui/conf').LinguiConfig} */
export default {
    locales,
    sourceLocale: 'en',
    compileNamespace: 'ts',
    catalogs: [
        {
            path: 'src/locales/{locale}/messages',
            include: ['src/**'],
            exclude: ['src/locales/**', 'src/**/__tests__/**', 'src/**/*.test.*'],
        },
    ],
    formatOptions: {
        origins: true,
        lineNumbers: false,
    },
    orderBy: 'messageId',
    format: formatter({ origins: false }),
};
