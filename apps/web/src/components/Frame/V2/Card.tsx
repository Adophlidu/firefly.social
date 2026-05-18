import { Source } from '@dimensiondev/enums';
import type { AppRouterProgressInstance } from '@bprogress/next';
import type { Context, SetPrimaryButton } from '@farcaster/miniapp-host';
import { memo, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { FootnoteLink } from '@/components/FootnoteLink.js';
import { frameComposeCast } from '@/components/Frame/V2/frameComposeCast.js';
import { frameSwapToken } from '@/components/Frame/V2/frameSwapToken.js';
import { Image } from '@/components/Image.js';

import { SITE_NAME } from '@/constants/static.js';
import { useRouter } from '@/esm/navigation.js';
import { getCurrentProfileFromStorage, type StateProfile } from '@/helpers/getCurrentProfileFromStorage.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { logger } from '@/libs/Logger.js';
import { FrameViewerModalRef } from '@/modals/FrameViewerModal/refs.js';
import { RelayConfirmationPopoverRef } from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';
import { FarcasterFrameHost } from '@/providers/frame/Host.js';
import { captureFrameActionEvent } from '@/providers/telemetry/captureFrameActionEvent.js';
import { type Post, type Profile, SessionType } from '@/providers/types/SocialMedia.js';
import type { FrameV2 } from '@/types/frame.js';

function createFrameHost(
    frame: FrameV2,
    post: Post,
    router: AppRouterProgressInstance,
    options?: {
        setPrimaryButton?: SetPrimaryButton;
        profile?: StateProfile | null;
    },
): FarcasterFrameHost {
    const profile = options?.profile ?? getCurrentProfileFromStorage(Source.Farcaster);
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

    const frameHost = new FarcasterFrameHost(context, {
        frame: () => frame,
        ready: (options) => {
            logger.debug('[frame host]: ready options', JSON.stringify(options));
            return FrameViewerModalRef.open({
                ready: true,
                frame,
                frameHost,
            });
        },
        signIn: async (options) => {
            logger.debug('[frame host]: signIn options', JSON.stringify(options));
            const signature = await RelayConfirmationPopoverRef.openAndWaitForClose({
                fid: context.client.clientFid,
                frame,
                options,
            });
            logger.debug('[frame host]: signIn result', JSON.stringify(signature));
            return signature;
        },
        close: () => {
            logger.debug('[frame host]: close');
            FrameViewerModalRef.close();
        },
        setPrimaryButton: options?.setPrimaryButton,
        viewCast: (hash) => {
            logger.debug('[frame host]: viewCast', hash);
            router.push(`/post/farcaster/${hash}`);
        },
        viewProfile: (profile: Profile) => {
            logger.debug('[frame host]: viewProfile', profile);
            router.push(`/profile/farcaster/${profile.handle}/feed`);
        },
        openMiniApps: (frame: FrameV2) => {
            logger.debug('[frame host]: openMiniApps', frame);
            FrameViewerModalRef.open({
                ready: false,
                frame,
                frameHost: createFrameHost(frame, post, router, { profile }),
            });
        },
        composeCast: frameComposeCast,
        swapToken: frameSwapToken,
    });

    return frameHost;
}

interface CardProps {
    post: Post;
    frame: FrameV2;
}

export const Card = memo<CardProps>(function Card({ post, frame }) {
    const router = useRouter();
    const isDarkMode = useIsDarkMode();

    const [primaryButton, setPrimaryButton] = useState<Parameters<SetPrimaryButton>[0] | null>(null);

    const frameHost = useMemo(() => {
        return createFrameHost(frame, post, router, {
            setPrimaryButton,
            profile: getCurrentProfileFromStorage(Source.Farcaster),
        });
    }, [frame, post, router]);

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
            frame,
            frameHost,
        });
    };

    return (
        <div className="flex flex-col" data-prevent-progress="true">
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
                    src={frame.imageUrl ?? frame.x_manifest?.frame.imageUrl}
                    fallback={isDarkMode ? '/image/miniapps-fallback-dark.png' : '/image/miniapps-fallback-light.png'}
                    alt={frame.x_url}
                />
                {primaryButton?.hidden ? null : (
                    <ClickableButton
                        className="bg-lightBg text-lightHighlight dark:bg-fireflyBrand px-1 py-3 font-bold dark:text-white"
                        disabled={primaryButton?.loading || primaryButton?.disabled}
                        onClick={onClick}
                        aria-label={
                            primaryButton?.text ||
                            frame.button.title ||
                            frame.x_manifest?.frame.buttonTitle ||
                            frame.button.action.name ||
                            'Frame action'
                        }
                    >
                        {primaryButton?.text ||
                            frame.button.title ||
                            frame.x_manifest?.frame.buttonTitle ||
                            frame.button.action.name}
                    </ClickableButton>
                )}
            </div>
            <FootnoteLink href={frame.x_url} />
        </div>
    );
});
