import { AddFundGuide } from '@/components/Bet/AddFundGuide.js';
import { BetLoadFailed } from '@/components/Bet/BetLoadFailed.js';
import { InvalidPolymarketAccountError } from '@/constants/error.js';

export function BetError({ error, reset }: { error: Error; reset?: () => void }) {
    if (error instanceof InvalidPolymarketAccountError) {
        return <AddFundGuide />;
    }
    return <BetLoadFailed reset={reset} />;
}
