import { memo, useState } from 'react';
import { Sheet } from 'tamagui';

import { type PerpsMeta } from '@/types/ui';
import { PerpsMarket } from '@/ui/Perps/PerpsMarket';

interface PerpsTokenSelectSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTokenSelected: (token: PerpsMeta) => void;
}

export const PerpsTokenSelectSheet = memo<PerpsTokenSelectSheetProps>(function PerpsTokenSelectSheet({
    open,
    onOpenChange,
    onTokenSelected,
}) {
    const [position, setPosition] = useState(0);

    return (
        <Sheet
            modal
            open={open}
            onOpenChange={onOpenChange}
            snapPointsMode="fit"
            dismissOnSnapToBottom
            position={position}
            onPositionChange={setPosition}
            zIndex={100_000}
        >
            <Sheet.Overlay
                animation="quick"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                opacity={0.16}
                backgroundColor="#000000"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="rgba(34, 33, 47, 0.03)"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
                shadowColor="#403D57"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={16}
                minHeight={250}
            >
                <Sheet.Handle width={48} height={4} borderRadius={100} backgroundColor="#D1D1D1" marginBottom={0} />

                <PerpsMarket onMarketSelect={onTokenSelected} />
            </Sheet.Frame>
        </Sheet>
    );
});
