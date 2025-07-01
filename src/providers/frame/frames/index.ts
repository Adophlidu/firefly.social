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

export const BUILT_IN_FRAMES = [
    [
        [
            'https://farcaster.xyz/miniapps/k3a-FwpFRgSC/ponder',
            'https://weponder.io/apps/social-predictions/predictions',
            'https://www.weponder.io/apps/social-predictions/predictions',
        ],
        PONDER,
    ],
];
