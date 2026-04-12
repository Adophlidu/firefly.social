import type { HTMLProps } from 'react';

import { getPublicS3Url, getPublicUrl } from '@/helpers/getPublicUrl.js';

const bgImageUrl = getPublicUrl('/image/sparks-default-card.png');
const defaultAvatar = getPublicS3Url('/og/sparks_account_avatar.png');

/* eslint-disable @next/next/no-img-element */
function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

export function SparkCardOgImage({ avatar, rank, name }: { avatar: string; rank: string; name: string }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                backgroundImage: `url(${bgImageUrl})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 100%',
            }}
        >
            <Image
                src={avatar || defaultAvatar}
                alt={name || 'profile'}
                width={144}
                height={144}
                style={{
                    marginTop: 86,
                    width: 144,
                    height: 144,
                    objectFit: 'cover',
                }}
            />

            <div
                style={{
                    marginTop: 50,
                    fontFamily: 'Bedstead',
                    fontWeight: 'bold',
                    fontSize: 20,
                    color: 'black',
                    maxWidth: 320,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'clip',
                    whiteSpace: 'nowrap',
                }}
            >{`#${rank}`}</div>
            {name ? (
                <div
                    style={{
                        marginTop: 17,
                        fontFamily: 'Bedstead',
                        fontWeight: 'bold',
                        fontSize: 42,
                        color: 'black',
                        textTransform: 'uppercase',
                        maxWidth: 320,
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {name}
                </div>
            ) : null}
        </div>
    );
}
