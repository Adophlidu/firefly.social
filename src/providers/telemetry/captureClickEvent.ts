import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { ArticlePlatform } from '@/providers/types/Article.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureDraftClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_DRAFT_BUTTON_CLICK, {});
    });
}

export function captureSchedulePostClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_SCHEDULE_POST_CLICK, {});
    });
}

export function captureRedPacketClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_RED_PACKET_CLICK, {});
    });
}

export function captureThreadClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_THREAD_CLICK, {});
    });
}

export function captureGifClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_GIF_CLICK, {});
    });
}

export function captureImageAddClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_IMAGE_ADD_CLICK, {});
    });
}

export function captureShareToChangeClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_SHARE_TO_CHANGE_SUCCESS, {});
    });
}

export function captureReplyRestrictionChangeClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_REPLY_RESTRICTION_CHANGE_SUCCESS, {});
    });
}

export function captureFarcasterChannelChangeClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_FARCASTER_CHANNEL_CHANGE_SUCCESS, {});
    });
}

export function captureLensClubChangeClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_LENS_CLUB_CHANGE_SUCCESS, {});
    });
}

export function captureEmojiClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_EMOJI_CLICK, {});
    });
}

export function captureScheduleTabClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_SCHEDULE_TAB_CLICK, {});
    });
}

export function captureDraftDeleteClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_DRAFT_DELETE_SUCCESS, {});
    });
}

export function captureNFTMintClickEvent(chainId: number, nftCa: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.NFT_MINT_CLICK, {
            chain_id: chainId,
            nft_ca: nftCa,
        });
    });
}

export function captureNFTViewWebsiteClickEvent(chainId: number, nftCa: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.NFT_MINT_CLICK, {
            chain_id: chainId,
            nft_ca: nftCa,
        });
    });
}

export function captureArticleClickEvent(platform: ArticlePlatform, fireflyAccountId: string) {
    return runInSafeAsync(async () => {
        switch (platform) {
            case ArticlePlatform.Mirror:
                return TelemetryProvider.captureEvent(EventId.MIRROR_ARTICLE_CLICK, {
                    firefly_account_id: fireflyAccountId,
                });
            case ArticlePlatform.Paragraph:
                return TelemetryProvider.captureEvent(EventId.PARAGRAPH_ARTICLE_CLICK, {
                    firefly_account_id: fireflyAccountId,
                });
            case ArticlePlatform.Matters:
                return TelemetryProvider.captureEvent(EventId.MATTERS_ARTICLE_CLICK, {
                    firefly_account_id: fireflyAccountId,
                });
            default:
                return;
        }
    });
}

export function captureArticleShareClickEvent(articleId: string, fireflyAccountId: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.ARTICLE_SHARE_CLICK, {
            article_id: articleId,
            firefly_account_id: fireflyAccountId,
        });
    });
}

export function captureArticleViewSourceClickEvent(articleId: string, fireflyAccountId: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.ARTICLE_VIEW_SOURCE_CLICK, {
            article_id: articleId,
            firefly_account_id: fireflyAccountId,
        });
    });
}

export function captureArticleBookmarkSuccessEvent(articleId: string, fireflyAccountId: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.ARTICLE_BOOKMARK_SUCCESS, {
            article_id: articleId,
            firefly_account_id: fireflyAccountId,
        });
    });
}

export function captureArticleLikeSuccessEvent(articleId: string) {
    return TelemetryProvider.captureEventInSafe(EventId.ARTICLE_LIKE_SUCCESS, {
        article_id: articleId,
    });
}
