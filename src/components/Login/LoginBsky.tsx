/* cspell:disable */

import { AtpAgent } from '@atproto/api';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { Source } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { LoginModalRef } from '@/modals/controls.js';

export function LoginBsky() {
    const [{ loading }, login] = useAsyncFn(async () => {
        const agent = new AtpAgent({
            service: DEFAULT_SERVICE_URL,
        });

        const response = await agent.login({
            identifier: env.external.NEXT_PUBLIC_BSKY_IDENTIFIER ?? '',
            password: env.external.NEXT_PUBLIC_BSKY_PASSWORD ?? '',
        });

        console.log('DEBUG: login response', response);

        if (response.success) {
            enqueueSuccessMessage(t`Your ${resolveSourceName(Source.Bsky)} account is now connected.`);

            // #region DEBUG
            const suji = await agent.getProfile({
                actor: 'suji',
            });
            console.log('DEBUG: suji', suji);
            // #endregion

            // TODO: persist the session
        }

        LoginModalRef.close();
    }, []);

    return (
        <div>
            <h1>Click the button below to login to Bluesky with the default account.</h1>
            <ClickableButton
                className="flex h-[42px] w-full items-center justify-center rounded-md border border-line"
                disabled={loading}
                onClick={login}
            >
                Login
            </ClickableButton>
        </div>
    );
}
