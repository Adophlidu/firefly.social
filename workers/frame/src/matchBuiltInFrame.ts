import type { FrameV2, LinkDigestedResponse } from '@/frame/src/types.js';

const PONDER = {
    version: 'v2',
    imageUrl: 'https://www.weponder.io/img/og/home.jpg',
    button: {
        title: 'Open',
        action: {
            type: 'launch_frame',
            name: 'Ponder',
            url: 'https://www.weponder.io/apps/social-predictions/predictions',
            splashImageUrl: 'https://www.weponder.io/logo.gif',
            splashBackgroundColor: '#0A131F',
        },
    },
};

const MONADIO = {
    version: 'v2',
    imageUrl: 'https://monadio.pages.dev/og.png',
    button: {
        title: 'Open',
        action: {
            type: 'launch_frame',
            name: 'LOUDIO MONADIO',
            url: 'https://monadio.pages.dev/',
            splashImageUrl: 'https://monadio.pages.dev/splash.png',
            splashBackgroundColor: '#03fff6',
        },
    },
};

const BUILT_IN_FRAMES = [
    [
        [
            'https://farcaster.xyz/miniapps/k3a-FwpFRgSC/ponder',
            'https://weponder.io/apps/social-predictions/predictions',
            'https://www.weponder.io/apps/social-predictions/predictions',
        ],
        PONDER,
    ],
    [['https://monadio.pages.dev', 'https://farcaster.xyz/miniapps/ZtPIpICd-YhR/loudio-monadio'], MONADIO],
] as Array<[string[], FrameV2]>;

export function matchBuiltInFrame(documentUrl: string): LinkDigestedResponse | null {
    for (const [urls, frame] of BUILT_IN_FRAMES) {
        if (urls.includes(documentUrl)) {
            console.log(`[frame] built-in frame found: ${documentUrl}`);
            return {
                frame: {
                    ...frame,
                    x_url: documentUrl,
                    x_version: 2,
                },
            };
        }
    }

    return null;
}
