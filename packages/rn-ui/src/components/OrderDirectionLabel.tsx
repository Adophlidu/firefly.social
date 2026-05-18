import { Trans } from '@lingui/react/macro';

interface OrderDirectionLabelProps {
    direction: string;
}

export function OrderDirectionLabel({ direction }: OrderDirectionLabelProps) {
    switch (direction) {
        case 'Close Long':
            return <Trans id="rn-ui.OrderDirectionLabel.closeLong">Close Long</Trans>;
        case 'Close Short':
            return <Trans id="rn-ui.OrderDirectionLabel.closeShort">Close Short</Trans>;
        case 'Open Long':
            return <Trans id="rn-ui.OrderDirectionLabel.openLong">Open Long</Trans>;
        case 'Open Short':
            return <Trans id="rn-ui.OrderDirectionLabel.openShort">Open Short</Trans>;
        default:
            return direction;
    }
}
