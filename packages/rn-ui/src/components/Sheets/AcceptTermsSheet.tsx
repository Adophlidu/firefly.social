import { useQueryClient } from '@tanstack/react-query';
import { useAtom, useAtomValue } from 'jotai';
import { memo, useState } from 'react';
import { Button, Sheet, Text, YStack } from 'tamagui';

import { SheetDragHandle } from '@/components/SheetDragHandle';
import { navigate } from '@/helpers/navigate';
import { toast } from '@/helpers/toast';
import { useUserActionState } from '@/hooks/Perps/useUserActionState';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { acceptTerms } from '@/services/acceptTerms';
import { acceptTermsSheetOpenAtom } from '@/store/tradeForm';
import { walletClientAtom } from '@/store/wallet';

export const AcceptTermsSheet = memo(function AcceptTermsSheet() {
    const [open, setOpen] = useAtom(acceptTermsSheetOpenAtom);
    const [position, setPosition] = useState(0);
    const queryClient = useQueryClient();
    const walletClient = useAtomValue(walletClientAtom);
    const { address } = useUserActionState();

    const [{ loading: isExecuting }, onAccept] = useAsyncFn(async () => {
        if (!walletClient || !address) return;

        try {
            await acceptTerms(walletClient, address);
            await queryClient.refetchQueries({
                queryKey: ['wallet', 'legalCheck', address.toLowerCase()],
            });
            setOpen(false);
        } catch {
            toast({ message: 'Failed to agree to legal terms. Please try again.', type: 'error' });
        }
    }, [walletClient, address, queryClient, setOpen]);

    return (
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
                gap={16}
            >
                <SheetDragHandle />

                <YStack width="100%">
                    <Text color="$text" fontSize={20} lineHeight={24} fontWeight={600} fontFamily="$body">
                        Term of Use and Privacy Policy
                    </Text>
                </YStack>

                <YStack width="100%" paddingHorizontal={4}>
                    <Text color="$text" fontSize={16} lineHeight={20} fontWeight={500} fontFamily="$body">
                        You acknowledge that you have read, understood, and agreed to the{' '}
                        <Text
                            color="$accent"
                            onPress={() => {
                                navigate('perps-terms', {});
                            }}
                        >
                            Terms of Use
                        </Text>{' '}
                        and{' '}
                        <Text
                            color="$accent"
                            onPress={() => {
                                navigate('perps-privacy', {});
                            }}
                        >
                            Privacy Policy
                        </Text>
                        .
                    </Text>
                </YStack>

                <Button
                    unstyled
                    height={48}
                    borderRadius={96}
                    width="100%"
                    backgroundColor="$text"
                    justifyContent="center"
                    alignItems="center"
                    disabled={isExecuting}
                    opacity={isExecuting ? 0.5 : 1}
                    onPress={isExecuting ? undefined : onAccept}
                >
                    <Text fontSize={16} fontWeight={700} color="$bgHover">
                        Accept
                    </Text>
                </Button>
            </Sheet.Frame>
        </Sheet>
    );
});
