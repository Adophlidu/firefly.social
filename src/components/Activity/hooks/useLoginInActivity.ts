import { nativeBridgeProvider, SupportedMethod } from '@firefly/native-bridge';
import { createLookupTableResolver } from '@firefly/utils';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { useActivityConnections } from '@/components/Activity/hooks/useActivityConnections.js';
import { FireflyPlatform, type SocialSource, Source } from '@/constants/enum.js';
import { UnreachableError } from '@/constants/error.js';
import { enqueueErrorMessage, enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useFireflyBridgeAuthorization } from '@/hooks/useFireflyBridgeAuthorization.js';
import { LoginModalRef } from '@/modals/LoginModal/index.js';
import { captureActivityLoginEventBySocialSource } from '@/providers/telemetry/captureActivityEvent.js';

const resolveFireflyBridgePlatformFromSocialSource = createLookupTableResolver<SocialSource, FireflyPlatform>(
    {
        [Source.Twitter]: FireflyPlatform.Twitter,
        [Source.Farcaster]: FireflyPlatform.Farcaster,
        [Source.Lens]: FireflyPlatform.Lens,
        [Source.Bsky]: FireflyPlatform.Lens,
    },
    (source) => {
        throw new UnreachableError('social source', source);
    },
);

export function useLoginInActivity() {
    const queryFireflyBridgeAuthorization = useFireflyBridgeAuthorization();
    const { refetch } = useActivityConnections();
    return useAsyncFn(async (source: SocialSource) => {
        if (nativeBridgeProvider.supported) {
            try {
                const result = await nativeBridgeProvider.request(SupportedMethod.LOGIN, {
                    platform: resolveFireflyBridgePlatformFromSocialSource(source),
                });
                await queryFireflyBridgeAuthorization.refetch();
                if (result === 'true') {
                    captureActivityLoginEventBySocialSource(source);
                    enqueueSuccessMessage(t`Login ${resolveSourceName(source)} successfully.`);
                } else {
                    enqueueErrorMessage(t`Failed to login.`);
                }
            } catch (error) {
                enqueueMessageFromError(error, t`Failed to login.`);
                throw error;
            }
            await refetch();
            return;
        }
        await LoginModalRef.openAndWaitForClose({
            source,
        });
    });
}
