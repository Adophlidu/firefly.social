'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { TwitterArticleBody } from '@/components/Article/TwitterArticleBody.js';
import { EmbedCards } from '@/components/EmbedCards/index.js';
import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { Link } from '@/components/Link.js';
import { NakedMarkup } from '@/components/Markup/NakedMarkup.js';
import { PostMarkup } from '@/components/Markup/PostMarkup.js';
import { FramePoll } from '@/components/Poll/FramePoll.js';
import { PollCard } from '@/components/Poll/PollCard.js';
import { Attachments } from '@/components/Posts/Attachment.js';
import { CollapsedContent } from '@/components/Posts/CollapsedContent.js';
import { ContentTranslator } from '@/components/Posts/ContentTranslator.js';
import { PostBodyReplyContent } from '@/components/Posts/PostBodyReplyContent.js';
import { PostLinks } from '@/components/Posts/PostLinks.js';
import { Quote } from '@/components/Posts/Quote.js';
import { useParseRedPacket } from '@/components/RedPacket/hooks/useParseRedPacket.js';
import { RedPacketCard } from '@/components/RedPacket/RedPacketCard.js';
import { TruthSocialPostMarkup } from '@/components/TrumpTruthSocial/TruthSocialPostMarkup.js';
import { IS_APPLE, IS_SAFARI } from '@/constants/browser.js';
import { SUPPORTED_MULTIPLE_EMBED_SOURCES } from '@/constants/computed.js';
import { PageRoute, Source, STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { EMPTY_LIST, MIN_CHAR_LENGTH_TO_TRANSLATE, RP_HASH_TAG } from '@/constants/static.js';
import { usePathname, useRouter } from '@/esm/navigation.js';
import { getEncryptedPayloadFromText } from '@/helpers/getEncryptedPayloadFromText.js';
import { getPollIdFromLink } from '@/helpers/getPollIdFromLink.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { resolveOembedUrl } from '@/helpers/resolveOembedUrl.js';
import { resolvePostArticleUrl } from '@/helpers/resolvePostArticleUrl.js';
import { trimify } from '@/helpers/trimify.js';
import { useEverSeen } from '@/hooks/useEverSeen.js';
import { useForkRef } from '@/hooks/useForkRef.js';
import { useIsProfileMuted } from '@/hooks/useIsProfileMuted.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { useTwitterProfileStore } from '@/store/useProfileStore/useTwitterProfileStore.js';

export interface PostBodyContentProps {
    post: Post;
    isQuote?: boolean;
    isReply?: boolean;
    isDetail?: boolean;
    isComment?: boolean;
    isInCompose?: boolean;
    showMore?: boolean;
    disablePadding?: boolean;
    showTranslate?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}

export function checkIfHasRedPacket(post: Post) {
    const content = post.metadata.content?.content;

    return content?.includes(RP_HASH_TAG) || !!getEncryptedPayloadFromText(content);
}

export function PostBodyContent({ ref, ...props }: PostBodyContentProps) {
    const {
        post,
        isQuote = false,
        isReply = false,
        isDetail = false,
        showMore = !isDetail,
        disablePadding = false,
        showTranslate = false,
        isInCompose = false,
    } = props;

    const router = useRouter();
    const currentTwitterProfileSession = useTwitterProfileStore.use.currentProfileSession();
    const { metadata, author } = post;
    const postRawContent = metadata.content?.content;
    // ! liteRawContent is used for reply and quote, only shows the first 2000 characters, because the text is foldable
    const liteRawContent = metadata.content?.content?.slice(0, 2000);
    const isExpanded = post.incomplete && post.fullContent === post.metadata.content?.content;
    const canShowMore = !isExpanded && !!(postRawContent && postRawContent.length > 450) && showMore;

    const postContent = metadata.content?.truncatedContent || postRawContent || '';
    const [seen, seenRef] = useEverSeen({ rootMargin: '300px 0px' });
    const mergedRef = useForkRef(ref, seenRef);

    const attachments = metadata.content?.attachments ?? EMPTY_LIST;

    const muted = useIsProfileMuted(author.source, author.profileId, author.viewerContext?.blocking, isDetail);

    const isMedium = useIsMedium('max');

    const pathname = usePathname();

    const isProfilePage = pathname === PageRoute.Profile || isRoutePathname(pathname, PageRoute.Profile);
    const isTokenPage = /^\/token\b/.test(pathname);

    const hasRedpacket = checkIfHasRedPacket(post);
    const {
        metadata: redPacketMetadata,
        payloadImage,
        isLoading: isParsingRedPacket,
    } = useParseRedPacket('', post, hasRedpacket);

    // if payload image attachment is available, we don't need to show the attachments
    const availableAttachments = useMemo(() => {
        if (!payloadImage) return attachments;
        return attachments.filter((x) => x.uri !== payloadImage);
    }, [attachments, payloadImage]);

    const showAttachments =
        (availableAttachments.length > 0 || !!metadata.content?.asset) && (!hasRedpacket || !isParsingRedPacket);

    const noLeftPadding = isDetail || isMedium || disablePadding;

    const oembedUrl = resolveOembedUrl(post);
    const pollId = oembedUrl ? getPollIdFromLink(oembedUrl, post.source) : undefined;

    const hasEncryptedPayload = !!redPacketMetadata;
    const EncryptedContent = useMemo(() => {
        if (!seen || isInCompose || !redPacketMetadata) return null;
        if (post.source === Source.Twitter && !currentTwitterProfileSession) return null;

        return <RedPacketCard post={post} payload={redPacketMetadata as RedPacketJSONPayload} />;
    }, [seen, isInCompose, redPacketMetadata, post, currentTwitterProfileSession]);

    if (post.isHidden || (muted && !isProfilePage)) {
        return (
            <CollapsedContent
                className={classNames({
                    '-mt-3 pl-[52px]': !noLeftPadding,
                    'my-2': !isQuote,
                })}
                ref={ref}
                authorMuted={muted}
                isQuote={isQuote}
            />
        );
    }

    const supportMultipleEmbeds = SUPPORTED_MULTIPLE_EMBED_SOURCES.includes(post.source);
    const LinksContent =
        !isParsingRedPacket && (supportMultipleEmbeds || (!hasEncryptedPayload && !pollId)) ? (
            <PostLinks hasRpPayload={!!hasEncryptedPayload} hasPoll={!!pollId} post={post} />
        ) : null;

    if (isQuote) {
        return (
            <div className="my-2 break-words text-base text-main" ref={mergedRef}>
                <NakedMarkup
                    post={post}
                    className={classNames(
                        'linkify line-clamp-5 w-full self-stretch break-words text-left text-medium opacity-75',
                        {
                            'max-h-[7.8rem]': IS_SAFARI && IS_APPLE,
                        },
                    )}
                >
                    {liteRawContent}
                </NakedMarkup>
                {EncryptedContent}
                {showAttachments ? (
                    <Attachments
                        post={post}
                        attachments={availableAttachments}
                        isQuote={!!metadata.content?.content?.length}
                    />
                ) : null}
                {LinksContent}
            </div>
        );
    }

    if (isReply) return <PostBodyReplyContent post={post} />;

    return (
        <article
            className={classNames('mb-1.5 break-words text-base text-main', {
                '-mt-2 pl-[52px]': !noLeftPadding,
                'mt-1.5': noLeftPadding,
            })}
            ref={mergedRef}
        >
            {post.isTruthSocial ? (
                <TruthSocialPostMarkup post={post} postContent={postContent} />
            ) : (
                <PostMarkup post={post} canShowMore={canShowMore} content={postContent} />
            )}

            {post.metadata.article ? (
                <Link href={resolvePostArticleUrl(post)} target="_blank" onClick={(e) => e.stopPropagation()}>
                    <TwitterArticleBody {...post.metadata.article} />
                </Link>
            ) : null}

            {showTranslate &&
            env.external.NEXT_PUBLIC_POST_TRANSLATE === STATUS.Enabled &&
            trimify(postContent)?.length > MIN_CHAR_LENGTH_TO_TRANSLATE ? (
                <ContentTranslator content={trimify(postContent)} canShowMore={canShowMore} post={post} />
            ) : null}

            {canShowMore ? (
                <div className="text-medium font-bold text-highlight">
                    <div
                        onClick={() => {
                            if (post.isTruthSocial) {
                                return;
                            }
                            router.push(getPostUrl(post));
                        }}
                    >
                        <Trans>Show More</Trans>
                    </div>
                </div>
            ) : null}

            {!isTokenPage ? (
                <ErrorBoundary message="Failed to render embeds cards.">
                    <EmbedCards post={post} />
                </ErrorBoundary>
            ) : null}
            {EncryptedContent}

            {/* Poll */}
            {!isParsingRedPacket && (!hasEncryptedPayload || supportMultipleEmbeds) ? (
                pollId && oembedUrl ? (
                    <FramePoll post={post} pollId={pollId} frameUrl={oembedUrl} />
                ) : post.poll || post.hasPoll ? (
                    <PollCard post={post} frameUrl={''} />
                ) : null
            ) : null}

            {showAttachments ? (
                <Attachments post={post} attachments={availableAttachments} isDetail={isDetail} />
            ) : null}

            {LinksContent}

            {!!post.quoteOn && !isQuote ? <Quote post={post.quoteOn} /> : null}
        </article>
    );
}
