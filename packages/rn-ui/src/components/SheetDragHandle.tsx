import type { ComponentProps } from 'react';
import { memo } from 'react';
import { Sheet } from 'tamagui';

type Props = ComponentProps<typeof Sheet.Handle>;

/**
 * Centered sheet drag indicator for RN/Tamagui. Sheet.Frame defaults can leave
 * Sheet.Handle stretched or left-aligned; alignSelf centers it horizontally.
 */
export const SheetDragHandle = memo(function SheetDragHandle({
    width = 48,
    height = 4,
    borderRadius = 100,
    backgroundColor = '#D1D1D1',
    marginBottom = 0,
    alignSelf = 'center',
    ...rest
}: Props) {
    return (
        <Sheet.Handle
            width={width}
            height={height}
            borderRadius={borderRadius}
            backgroundColor={backgroundColor}
            marginBottom={marginBottom}
            alignSelf={alignSelf}
            {...rest}
        />
    );
});
