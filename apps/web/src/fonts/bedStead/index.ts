import localFont from 'next/font/local';

export const bedStead = localFont({
    src: [
        {
            path: './bedstead.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: './bedstead-bold.woff2',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--font-bedstead',
    display: 'swap',
    preload: true,
});
