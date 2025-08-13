import localFont from 'next/font/local';

export const bedStead = localFont({
    src: [
        {
            path: './bedstead.otf',
            weight: '400',
            style: 'normal',
        },
        {
            path: './bedstead-bold.otf',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--font-bedstead',
    display: 'swap',
    preload: true,
});
