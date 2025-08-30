import type { Context, SetPrimaryButton } from '@farcaster/miniapp-host';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { FootnoteLink } from '@/components/FootnoteLink.js';
import { Image } from '@/components/Image.js';
import { Source } from '@/constants/enum.js';
import { SITE_NAME } from '@/constants/index.js';
import { useRouter } from '@/esm/navigation.js';
import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { FrameViewerModalRef } from '@/modals/FrameViewerModal/FrameViewerModal.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import { captureFrameActionEvent } from '@/providers/telemetry/captureFrameActionEvent.js';
import { type Post, type Profile, SessionType } from '@/providers/types/SocialMedia.js';
import type { FrameV2 } from '@/types/frame.js';

interface CardProps {
    post: Post;
    frame: FrameV2;
}

export const Card = memo<CardProps>(function Card({ post, frame }) {
    const router = useRouter();

    const [primaryButton, setPrimaryButton] = useState<Parameters<SetPrimaryButton>[0] | null>(null);

    const [frameHost] = useState(() => {
        const profile = getProfileFromStorage(Source.Farcaster);
        const fid = Number.parseInt(profile?.profileId ?? '0', 10);
        const context = {
            user: {
                fid,
                username: profile?.handle,
                displayName: profile?.displayName,
                pfpUrl: profile?.pfp,
                location: {
                    placeId: 'firefly',
                    description: SITE_NAME,
                },
            },
            location: {
                type: 'cast_embed',
                embed: resolvePostUrl(post.source, post.postId),
                cast: {
                    author: {
                        fid: Number.parseInt(post.author.profileId, 10),
                        username: post.author.handle,
                        displayName: post.author.displayName,
                        pfpUrl: post.author.pfp,
                    },
                    hash: post.postId,
                    parentFid: post.parentAuthor?.profileId as number | undefined,
                    parentHash: post.parentPostId,
                    text: post.metadata.content?.content ?? '',
                    embeds: post.metadata.content?.oembedUrls ?? [],
                    channelKey: post.parentChannelKey,
                    timestamp: post.timestamp,
                    mentions: post.mentions?.map((mention) => ({
                        fid: Number.parseInt(mention.profileId, 10),
                    })),
                },
            },
            client: {
                added: false,
                clientFid: fid,
            },
        } satisfies Context.MiniAppContext;

        return new FarcasterFrameHost(context, {
            frame: () => frame,
            ready: (options) =>
                FrameViewerModalRef.open({
                    ready: true,
                    timeout: false,
                    frame,
                    frameHost,
                }),
            close: () => FrameViewerModalRef.close(),
            setPrimaryButton,
            viewCast: (hash: string) => {
                router.push(`/post/farcaster/${hash}`);
            },
            viewProfile: (profile: Profile) => {
                router.push(`/profile/farcaster/${profile.handle}`);
            },
        });
    });

    const onClick = () => {
        const session = getSessionFromStorage(SessionType.Farcaster);
        if (!session) {
            openLoginModal({
                source: Source.Farcaster,
            });
            return;
        }

        captureFrameActionEvent('click', frame);

        FrameViewerModalRef.open({
            ready: false,
            timeout: false,
            frame,
            frameHost,
        });
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col overflow-hidden rounded-xl">
                <Image
                    className="h-auto w-full"
                    style={{
                        backgroundColor: frame.button.action.splashBackgroundColor,
                        aspectRatio: '1.5 / 1',
                        objectFit: 'cover',
                        objectPosition: 'center center',
                    }}
                    width={530}
                    height={350}
                    src={frame.imageUrl}
                    alt={frame.x_url}
                />
                {primaryButton?.hidden ? null : (
                    <ClickableButton
                        className="bg-lightBg px-1 py-3 font-bold text-lightHighlight dark:bg-fireflyBrand dark:text-white"
                        disabled={primaryButton?.loading || primaryButton?.disabled}
                        onClick={onClick}
                    >
                        {primaryButton?.text ||
                            frame.x_manifest?.frame.buttonTitle ||
                            frame.button.title ||
                            frame.button.action.name}
                    </ClickableButton>
                )}
            </div>
            <FootnoteLink href={frame.x_url} />
        </div>
    );
});
