import { Trans } from '@lingui/react/macro';

interface OrderTypeLabelProps {
    type: string;
}

export function OrderTypeLabel({ type }: OrderTypeLabelProps) {
    switch (type) {
        case 'Market':
            return <Trans id="rn-ui.order-type.market">Market</Trans>;
        case 'Limit':
            return <Trans id="rn-ui.order-type.limit">Limit</Trans>;
        case 'Stop Market':
            return <Trans id="rn-ui.order-type.stop-market">Stop Market</Trans>;
        case 'Stop Limit':
            return <Trans id="rn-ui.order-type.stop-limit">Stop Limit</Trans>;
        case 'Take Profit Market':
            return <Trans id="rn-ui.order-type.take-profit-market">Take Profit Market</Trans>;
        case 'Take Profit Limit':
            return <Trans id="rn-ui.order-type.take-profit-limit">Take Profit Limit</Trans>;
        default:
            return type;
    }
}
