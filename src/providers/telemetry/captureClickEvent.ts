import { resolveCurrentFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureDraftClickEvent() {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.COMPOSE_DRAFT_BUTTON_CLICK, {});
    });
}

export function captureNFTMintClickEvent(chainId: number, nftCa: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.NFT_MINT_CLICK, {
            firefly_account_id: await resolveCurrentFireflyAccountId(),
            chain_id: chainId,
            nft_ca: nftCa,
        });
    });
}

export function captureNFTViewWebsiteClickEvent(chainId: number, nftCa: string) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.NFT_MINT_CLICK, {
            firefly_account_id: await resolveCurrentFireflyAccountId(),
            chain_id: chainId,
            nft_ca: nftCa,
        });
    });
}
