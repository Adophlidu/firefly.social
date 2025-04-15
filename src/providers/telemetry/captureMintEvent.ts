import { resolveCurrentFireflyAccountId } from '@/helpers/resolveFireflyProfileId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { getWalletEventParameters } from '@/providers/telemetry/getWalletEventParameters.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function captureMintNFTEvent(nftId: string, address: string, freeMint: boolean, nftCa: string) {
    return runInSafeAsync(async () => {
        const accountId = await resolveCurrentFireflyAccountId();
        return TelemetryProvider.captureEvent(EventId.MINT_NFT_SUCCESS, {
            firefly_account_id: accountId,
            free_mint: freeMint,
            nft_id: nftId,
            nft_ca: nftCa,
            ...getWalletEventParameters(address),
        });
    });
}
