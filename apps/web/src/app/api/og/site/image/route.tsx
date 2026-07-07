/* eslint-disable @next/next/no-img-element */

import { CACHE_AGE_INDEFINITE_ON_DISK } from '@dimensiondev/constants/static';
import { compose } from '@dimensiondev/utils';
import { ImageResponse } from 'next/og.js';
import type { HTMLProps } from 'react';

import { getPublicUrl } from '@/helpers/getPublicUrl.js';
import { withRequestErrorHandler } from '@/helpers/withRequestErrorHandler.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';

const OG_FONT_FAMILY = ['Inter', 'Noto Sans Symbols 2'];
const OGBackgroundSVG = getPublicUrl('/svg/og-background.svg');

const SITE_HEADLINE = "Explore what's happening onchain";
const SITE_TAGLINE = 'Everything App for Web3 Natives';

function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

function SiteOpenGraphImage() {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                background: '#fff',
                position: 'relative',
                fontFamily: OG_FONT_FAMILY.join(','),
            }}
        >
            <Image
                src={OGBackgroundSVG}
                alt="og-background"
                style={{ position: 'absolute', top: 0, left: 0, width: '1200px', height: '630px' }}
                width={1200}
                height={630}
            />

            <div
                style={{
                    position: 'absolute',
                    display: 'flex',
                    top: '91px',
                    left: '80px',
                    width: '766px',
                    height: '456px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    textAlign: 'center',
                    padding: '56px',
                    boxSizing: 'border-box',
                    gap: '24px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        fontSize: '48px',
                        lineHeight: '56px',
                        fontWeight: 700,
                        color: '#000',
                        maxWidth: '100%',
                    }}
                >
                    {SITE_HEADLINE}
                </div>
                <div
                    style={{
                        display: 'flex',
                        fontSize: '28px',
                        lineHeight: '36px',
                        fontWeight: 400,
                        color: '#767676',
                        maxWidth: '100%',
                    }}
                >
                    {SITE_TAGLINE}
                </div>
            </div>
        </div>
    );
}

export const GET = compose(withRequestErrorHandler(), async () => {
    return new ImageResponse(<SiteOpenGraphImage />, {
        width: 1200,
        height: 630,
        headers: {
            'Cache-Control': CACHE_AGE_INDEFINITE_ON_DISK,
        },
        fonts: await getSatoriFonts(OG_FONT_FAMILY),
    });
});
