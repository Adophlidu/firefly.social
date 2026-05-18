'use client';

import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { signIn } from 'next-auth/react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import type { ThirdPartySource } from '@/constants/enum.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { getTelegramLoginUrl } from '@/providers/firefly/auth/getTelegramLoginUrl.js';

interface Props {
    source: ThirdPartySource | Source.Email;
}

export function ThirdPartConnectButton({ source }: Props) {
    const [{ loading }, handleConnect] = useAsyncFn(async (source: ThirdPartySource | Source.Email) => {
        try {
            switch (source) {
                case Source.Telegram:
                    const url = await getTelegramLoginUrl();
                    if (!url) return;
                    location.href = url;
                    break;
                case Source.Apple:
                case Source.Google:
                    await signIn(resolveSourceInUrl(source));
                    break;
                case Source.Email:
                    await LoginModalRef.openAndWaitForClose({
                        source: Source.Email,
                    });
                    break;
                default:
                    safeUnreachable(source);
            }
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to connect on {source}</Trans>);
            throw error;
        }
    }, []);

    if (loading) {
        return <LoadingIcon className="text-lightMain" />;
    }

    return (
        <ClickableButton
            className="text-medium text-lightMain font-bold leading-4"
            disabled={loading}
            onClick={() => handleConnect(source)}
        >
            <Trans>Connect</Trans>
        </ClickableButton>
    );
}
