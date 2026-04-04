import { type HTMLProps } from 'react';

import { Image } from '@/components/Image.js';
import { type RedPacketCoverOptions, useRedPacketCover } from '@/components/RedPacket/hooks/useRedPacketCover.js';

interface Props extends HTMLProps<HTMLDivElement>, RedPacketCoverOptions {}

export function RedPacketEnvelope({
    rpid,
    themeId,
    token,
    shares,
    total,
    sender,
    message,
    claimedAmount,
    claimed,
    type,
    usage,
    ...rest
}: Props) {
    const { data: cover } = useRedPacketCover({
        rpid,
        themeId,
        token,
        shares,
        total,
        sender,
        message,
        claimedAmount,
        claimed,
        type,
        usage,
    });

    return (
        <div className="size-full" {...rest}>
            {cover ? <Image alt="cover" width={220} height={154} src={cover?.url} /> : null}
        </div>
    );
}
