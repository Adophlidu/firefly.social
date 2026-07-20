import PolymarketEntryIcon from '@dimensiondev/assets/bet-entry.svg';
import { Trans } from '@lingui/react/macro';
import { useNavigate } from '@dimensiondev/ssr';

import { BetNavigationBar } from '@/components/Bet/BetNavigationBar.js';
import { Button } from '@/components/ui/button.js';
import { ModalType } from '@/configs/modalRoutes.js';
import { captureWalletTelemetryEvent, WalletTelemetryEventId } from '@/helpers/swap/swapAnalytics.js';
import { useOpenBetDeposit } from '@/hooks/bet/useOpenBetDeposit.js';

export function AddFundGuide() {
    const navigate = useNavigate();
    const openBetDeposit = useOpenBetDeposit();

    const openDepositViaCrypto = () => {
        // Explicit QR entry, so telemetry fires (the balance-gated shortcut is silent).
        captureWalletTelemetryEvent(WalletTelemetryEventId.BETS_DEPOSIT_VIA_CRYPTO_CLICK, {});
        navigate(`/bet?modal=${ModalType.DepositViaCrypto}`);
    };

    return (
        <div className="fixed inset-0 z-10 flex w-full flex-col bg-primaryBottom">
            <BetNavigationBar hideExportKey />
            <div className="flex w-full flex-1 flex-col items-center justify-center space-y-6 px-6 pb-10">
                <PolymarketEntryIcon width={88} height={88} />
                <div className="flex w-full flex-col items-center space-y-6 p-6">
                    <div className="flex w-full flex-col items-center space-y-2 text-center">
                        <h3 className="text-lg font-semibold">
                            <Trans>Predict on Polymarket</Trans>
                        </h3>
                        <p className="text-sm text-second">
                            <Trans>Predict. Trade. Simply fund your Firefly predict wallet to begin.</Trans>
                        </p>
                    </div>
                    <div className="flex w-full flex-col space-y-3">
                        <Button variant="primary" size="lg" className="w-full rounded-full" onClick={openBetDeposit}>
                            <Trans>Fund via Firefly Wallet</Trans>
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full rounded-full"
                            onClick={openDepositViaCrypto}
                        >
                            <Trans>Deposit via Crypto Address</Trans>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
