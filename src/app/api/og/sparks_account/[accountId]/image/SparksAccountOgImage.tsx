import type { HTMLProps } from 'react';
import urlcat from 'urlcat';

import { FIREFLY_S3_URL } from '@/constants/index.js';
import type { SparksAccountResponse } from '@/providers/types/Firefly.js';

interface SparksAccountOgImageProps {
    account: Required<SparksAccountResponse>['data'];
}

const bgImageUrl = urlcat(FIREFLY_S3_URL, '/og/genesis_sparks_bg.png');
const defaultAvatar = urlcat(FIREFLY_S3_URL, '/og/sparks_account_avatar.png');

/* eslint-disable @next/next/no-img-element */
function Image({ src, ...props }: Pick<HTMLProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'style'>) {
    return <img alt="img" {...props} src={src} />;
}

export function SparksAccountOgImage({ account }: SparksAccountOgImageProps) {
    const ogId = account.rank === '00000' ? '?????' : account.rank;

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
                src={account.avatar || defaultAvatar}
                alt={account.name || 'profile'}
                width={144}
                height={144}
                style={{
                    marginTop: 139,
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
            >{`#${ogId}`}</div>
            {account.name ? (
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
                    {account.name}
                </div>
            ) : null}
        </div>
    );
}
