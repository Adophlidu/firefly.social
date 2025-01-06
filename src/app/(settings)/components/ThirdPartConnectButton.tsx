import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { signIn } from 'next-auth/react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Source, type ThirdPartySource } from '@/constants/enum.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

interface Props {
    source: ThirdPartySource;
}

export function ThirdPartConnectButton({ source }: Props) {
    const [{ loading }, handleConnect] = useAsyncFn(async (source: ThirdPartySource) => {
        try {
            switch (source) {
                case Source.Telegram:
                    const url = await FireflyEndpointProvider.getTelegramLoginUrl();
                    if (!url) return;
                    window.location.href = url;
                    break;
                case Source.Apple:
                case Source.Google:
                    await signIn(resolveSourceInUrl(source));
                    break;
                default:
                    safeUnreachable(source);
            }
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to connect on ${source}`);
            throw error;
        }
    }, []);

    if (loading) {
        return <LoadingIcon className="text-lightMain" />;
    }

    return (
        <ClickableButton
            className="text-medium font-bold leading-4 text-lightMain"
            disabled={loading}
            onClick={() => handleConnect(source)}
        >
            <Trans>Connect</Trans>
        </ClickableButton>
    );
}
