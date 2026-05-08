import { TradesHistory } from '@dimensiondev/rn-ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/perps/history')({
    component: PerpsHistory,
});

function PerpsHistory() {
    return (
        <div className="h-screen w-screen">
            <TradesHistory />
        </div>
    );
}
