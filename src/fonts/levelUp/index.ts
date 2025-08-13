import localFont from 'next/font/local';

export const levelUp = localFont({
    src: './level-up.otf',
    variable: '--font-level-up',
    display: 'swap',
    preload: true,
});
