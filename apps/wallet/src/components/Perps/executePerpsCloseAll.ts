interface ExecutePerpsCloseAllOptions {
    cancelOpeningOrders?: () => Promise<void>;
    closePositions: () => Promise<void>;
    cancelReduceOnlyOrders?: () => Promise<void>;
}

export class PerpsPartialSuccessError extends Error {}

export async function executePerpsCloseAll({
    cancelOpeningOrders,
    closePositions,
    cancelReduceOnlyOrders,
}: ExecutePerpsCloseAllOptions) {
    let openingOrdersCanceled = false;
    if (cancelOpeningOrders) {
        await cancelOpeningOrders();
        openingOrdersCanceled = true;
    }

    try {
        await closePositions();
    } catch (cause) {
        if (!openingOrdersCanceled) throw cause;
        throw new PerpsPartialSuccessError(
            'Open orders were canceled, but the positions could not be closed. Review your positions before retrying.',
            { cause },
        );
    }

    if (!cancelReduceOnlyOrders) return;

    try {
        await cancelReduceOnlyOrders();
    } catch (cause) {
        throw new PerpsPartialSuccessError(
            'Position closes were submitted, but some reduce-only orders could not be canceled. Review your open orders.',
            { cause },
        );
    }
}
