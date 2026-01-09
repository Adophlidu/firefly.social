'use client';

import { Trans } from '@lingui/react/macro';

import RedPacketIcon from '@/assets/red-packet.svg';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { RedPacketCardContent } from '@/components/RedPacket/RedPacketCardContent.js';
import { type RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { type Post } from '@/providers/types/SocialMedia.js';

interface Props {
    payload: RedPacketJSONPayload;
    post: Post;
}

export function RedPacketCard(props: Props) {
    return (
        <div
            className="relative my-2 flex min-h-[282px] flex-col gap-3 rounded-2xl p-3 text-lightTextMain md:min-h-[398px]"
            style={{
                background:
                    'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%), linear-gradient(90deg, rgba(28, 104, 243, 0.2) 0%, rgba(249, 55, 55, 0.2) 100%), #FFFFFF',
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-[6px]">
                    <RedPacketIcon width={24} height={24} />
                    <strong className="text-base leading-5">
                        <Trans>Lucky Drop</Trans>
                    </strong>
                </div>
            </div>
            <ErrorBoundary>
                <RedPacketCardContent {...props} />
            </ErrorBoundary>
        </div>
    );
}
