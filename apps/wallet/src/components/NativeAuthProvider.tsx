import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';
import { Trans } from '@lingui/react/macro';
import { useSetAtom } from 'jotai';
import { useAsync } from 'react-use';

import { LoadingPanel } from '@/components/LoadingPanel.js';
import { logger } from '@/lib/Logger.js';
import { fireflySessionStorageAtom } from '@/store/fireflySession.js';
import { store } from '@/store/index.js';

/**
 * Component to fetch authorization from native app and set it to firefly session atom.
 * This should be used in pages that are opened directly in native app (like /fund page).
 */
export function NativeAuthProvider({ children }: { children: React.ReactNode }) {
    const setFireflySession = useSetAtom(fireflySessionStorageAtom);

    const { loading, error } = useAsync(
        async function getAuthorization() {
            try {
                const existingState = store.get(fireflySessionStorageAtom);
                if (existingState?.state?.currentProfileSession) {
                    return;
                }

                // Try to get authorization from native app
                const token = (await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {})) as string;

                if (token && token !== 'No Login') {
                    // Create a minimal firefly-state with the token
                    // Format: firefly:{base64(sessionJSON)}
                    const sessionData = {
                        type: 'firefly',
                        profileId: '', // Will be filled by backend
                        token,
                        createdAt: Date.now(),
                        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
                    };
                    const sessionJSON = JSON.stringify(sessionData);
                    const sessionBase64 = btoa(sessionJSON);
                    const currentProfileSession = `firefly:${sessionBase64}`;

                    setFireflySession({
                        state: {
                            status: 'authenticated',
                            accounts: null,
                            currentProfile: null,
                            currentProfileSession,
                        },
                        version: 1,
                    });
                }
            } catch (error) {
                logger.error('[NativeAuthProvider] Failed to get authorization:', error);
            }
        },
        [setFireflySession],
    );
    if (loading) {
        return (
            <LoadingPanel>
                <Trans>Authenticating...</Trans>
            </LoadingPanel>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="mb-4 text-xl font-semibold">
                        <Trans>Authentication Error</Trans>
                    </h2>
                    <p className="mb-6 text-gray-600">
                        <Trans>Failed to authenticate. Please try again.</Trans>
                    </p>
                </div>
            </div>
        );
    }

    return children;
}
