import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureMintNFTEvent(address: string, chainId: string, nftCa: string, freeMint: boolean) {
    return runInSafeAsync(async () => {
        return TelemetryProvider.captureEvent(EventId.MINT_NFT_SUCCESS, {
            chain_id: chainId,
            free_mint: freeMint,
            nft_ca: nftCa,
            ...getWalletEventParameters(address),
        });
    });
}
