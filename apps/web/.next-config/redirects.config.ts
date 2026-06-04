import type { NextConfig } from 'next';

export const redirectsConfig: NonNullable<NextConfig['redirects']> = async () => {
    return [
        {
            source: '/profile/far/:path*',
            destination: '/profile/farcaster/:path*',
            permanent: true,
        },
        {
            source: '/profile/twitter/:path*',
            destination: '/profile/x/:path*',
            permanent: true,
        },
        {
            source: '/following/transactions',
            destination: '/following/trades',
            permanent: true,
        },
        {
            source: '/prediction/category',
            destination: '/prediction/category/trending',
            permanent: true,
        },
    ];
};
