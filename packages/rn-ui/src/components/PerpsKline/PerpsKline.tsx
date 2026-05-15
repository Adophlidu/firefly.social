import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, YStack } from 'tamagui';

import { perpsKlineChartUrlBuilderAtom } from '@/store/global';
import { walletAddressAtom } from '@/store/wallet';

const CHART_HEIGHT = 320;

export interface PerpsKlineProps {
    coin: string;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
}

export const PerpsKline = memo<PerpsKlineProps>(function PerpsKline({ coin, onInteractionEnd, onInteractionStart }) {
    const walletAddress = useAtomValue(walletAddressAtom);
    const { build } = useAtomValue(perpsKlineChartUrlBuilderAtom);
    const src = useMemo(() => build(coin, walletAddress), [build, coin, walletAddress]);

    if (!src) {
        return (
            <YStack
                width="100%"
                height={CHART_HEIGHT}
                borderRadius={10}
                backgroundColor="$bgSubdued"
                justifyContent="center"
                alignItems="center"
            >
                <Text color="$textSubdued" fontSize={12}>
                    Chart URL not configured
                </Text>
            </YStack>
        );
    }

    return (
        <YStack width="100%" height={CHART_HEIGHT} borderRadius={10} overflow="hidden" backgroundColor="$bgSubdued">
            {Platform.OS === 'web' ? (
                <iframe
                    src={src}
                    title="Perp K-line"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 0,
                        display: 'block',
                        backgroundColor: 'transparent',
                    }}
                    sandbox="allow-scripts allow-same-origin"
                />
            ) : (
                <WebView
                    source={{ uri: src }}
                    sharedCookiesEnabled
                    scrollEnabled={false}
                    onTouchStart={onInteractionStart}
                    onTouchEnd={onInteractionEnd}
                    onTouchCancel={onInteractionEnd}
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                />
            )}
        </YStack>
    );
});
