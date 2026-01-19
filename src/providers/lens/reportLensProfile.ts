import { AccountReportReason } from '@lens-protocol/client';
import { reportAccount } from '@lens-protocol/client/actions';

import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionClientHolder } from '@/providers/lens/LensSessionClientHolder.js';

export async function reportLensProfile(profileId: string) {
    await ensureLensResult(
        reportAccount(lensSessionClientHolder.sessionClient, {
            account: safeEvmAddress(profileId),
            reason: AccountReportReason.RepetitiveSpam, // TODO: user select reason
        }),
    );

    return true;
}
