import PolymarketEntryIcon from '@dimensiondev/assets/bet-entry.svg';
import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { BetNavigationBar } from '@/components/Bet/BetNavigationBar.js';
import { Button } from '@/components/ui/button.js';

export function AddFundGuide() {
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
                    <Button asChild variant="primary" size="lg" className="w-full rounded-full">
                        <Link to="/bet/deposit">
                            <Trans>Add Funds</Trans>
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
