import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
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

export function captureEmojiClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_EMOJI_CLICK, {});
    });
}

export function captureGifClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_GIF_CLICK, {});
    });
}

export function captureVideoAddClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_VIDEO_ADD_CLICK, {});
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
        return TelemetryProvider.captureEvent(EventId.COMPOSE_LENS_CHANNEL_CHANGE_SUCCESS, {});
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
