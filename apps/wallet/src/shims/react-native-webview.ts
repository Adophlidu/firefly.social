/**
 * Stub for `react-native-webview` on web. The real package is native-only.
 * Anything that tries to use this on web (rather than relying on Platform.OS
 * branching) will throw, which is the loud-failure we want — the iframe path
 * should be selected on web instead.
 */
import type { ComponentType } from 'react';

interface WebViewProps {
    source: { uri: string };
    sharedCookiesEnabled?: boolean;
    style?: Record<string, unknown>;
}

export const WebView: ComponentType<WebViewProps> = () => {
    throw new Error('react-native-webview is not available on web; use the iframe branch.');
};
