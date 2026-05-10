import { memo, useEffect, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, useTheme, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { OrderType } from '@/constants/enum';

interface OrderTypeSheetProps {
    open: boolean;
    orderType: OrderType;
    onOpenChange: (open: boolean) => void;
    onConfirm?: (orderType: OrderType) => void;
}

const ORDER_TYPE_OPTIONS = [
    { value: OrderType.MARKET, label: 'Market' },
    { value: OrderType.LIMIT, label: 'Limit' },
];

function RadioChecked() {
    const theme = useTheme();
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
                fill={theme.text!.get()}
            />
            <Path
                d="M8.1 12L10.9 14.8L15.9 9.8"
                stroke={theme.bg!.get()}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function RadioUnchecked() {
    const theme = useTheme();
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
                stroke={theme.textDisabled!.get()}
                strokeWidth="1.5"
            />
        </Svg>
    );
}

function SheetOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <Button
            unstyled
            width="100%"
            padding={8}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            pressStyle={{ opacity: 0.78 }}
            onPress={onPress}
        >
            <Text color="$text" fontSize={16} lineHeight={24} fontWeight={600}>
                {label}
            </Text>
            {selected ? <RadioChecked /> : <RadioUnchecked />}
        </Button>
    );
}

export const OrderTypeSheet = memo<OrderTypeSheetProps>(function OrderTypeSheet({
    open,
    orderType,
    onOpenChange,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [selectedType, setSelectedType] = useState<OrderType>(orderType);

    useEffect(() => {
        setSelectedType(orderType);
    }, [orderType, open]);

    const handleSelect = (type: OrderType) => {
        setSelectedType(type);
        onConfirm?.(type);
        onOpenChange(false);
    };

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
                backgroundColor="$text"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="$bgHover"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
                shadowColor="$text"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={8}
                minHeight={124}
            >
                <YStack width="100%" gap={4}>
                    <SheetDragHandle />
                </YStack>

                <YStack width="100%" gap={0}>
                    {ORDER_TYPE_OPTIONS.map((option) => (
                        <SheetOption
                            key={option.value}
                            label={option.label}
                            selected={selectedType === option.value}
                            onPress={() => handleSelect(option.value)}
                        />
                    ))}
                </YStack>
            </Sheet.Frame>
        </Sheet>
    );
});
