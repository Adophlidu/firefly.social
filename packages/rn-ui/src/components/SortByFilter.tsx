import { memo, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, ScrollView, Sheet, styled, Text, useTheme, XStack, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { SolidArrowIcon } from '@/icons/SolidArrowIcon';

interface SortByFilterProps {
    data: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
}

const TriggerButton = styled(Button, {
    unstyled: true,
    height: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 1000,
    minWidth: 0,
    backgroundColor: '$bg',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '$borderSubdued',
    pressStyle: {
        opacity: 0.72,
    },
});

const TriggerContent = styled(XStack, {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
});

const MenuItemButton = styled(Button, {
    unstyled: true,
    width: '100%',
    minHeight: 40,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '$bg',
    pressStyle: {
        opacity: 0.72,
    },
});

function SelectedIcon() {
    const theme = useTheme();
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z"
                fill={theme.text!.get()}
            />
            <Path
                d="M10.5799 15.5798C10.3799 15.5798 10.1899 15.4998 10.0499 15.3598L7.21988 12.5298C6.92988 12.2398 6.92988 11.7598 7.21988 11.4698C7.50988 11.1798 7.98988 11.1798 8.27988 11.4698L10.5799 13.7698L15.7199 8.62984C16.0099 8.33984 16.4899 8.33984 16.7799 8.62984C17.0699 8.91984 17.0699 9.39984 16.7799 9.68984L11.1099 15.3598C10.9699 15.4998 10.7799 15.5798 10.5799 15.5798Z"
                fill={theme.bg!.get()}
            />
        </Svg>
    );
}

export const SortByFilter = memo<SortByFilterProps>(function SortByFilter({ value, data, onChange }) {
    const [position, setPosition] = useState(0);
    const [open, setOpen] = useState(false);
    const theme = useTheme();

    return (
        <>
            <TriggerButton
                onPress={() => {
                    setOpen(true);
                }}
            >
                <TriggerContent>
                    <Text color="$text" fontSize={14} lineHeight={18} fontWeight={400}>
                        {data.find((item) => item.value === value)?.label || 'Select'}
                    </Text>

                    <SolidArrowIcon width={14} height={14} stroke={theme.text!.get()} />
                </TriggerContent>
            </TriggerButton>

            <Sheet
                modal
                open={open}
                onOpenChange={setOpen}
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
                >
                    <SheetDragHandle marginBottom={4} />

                    <ScrollView width="100%" showsVerticalScrollIndicator={false}>
                        <YStack gap={2} width="100%">
                            {data.map((item, index) => {
                                const isActive = value === item.value;

                                return (
                                    <XStack key={index} width="100%">
                                        <MenuItemButton
                                            onPress={() => {
                                                onChange(item.value);
                                                setOpen(false);
                                            }}
                                        >
                                            <Text color="$text" fontSize={16} lineHeight={24} fontWeight={600}>
                                                {item.label}
                                            </Text>

                                            {isActive ? <SelectedIcon /> : null}
                                        </MenuItemButton>
                                    </XStack>
                                );
                            })}
                        </YStack>
                    </ScrollView>
                </Sheet.Frame>
            </Sheet>
        </>
    );
});
