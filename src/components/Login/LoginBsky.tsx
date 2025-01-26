/* cspell:disable */

import { AtpAgent } from '@atproto/api';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { useAsyncFn } from 'react-use';

import AtIcon from '@/assets/at.svg';
import LockIcon from '@/assets/lock.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { Source } from '@/constants/enum.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { LoginModalRef } from '@/modals/controls.js';

export function LoginBsky() {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [{ loading }, login] = useAsyncFn(async (account: string, password: string) => {
        const agent = new AtpAgent({
            service: DEFAULT_SERVICE_URL,
        });

        const response = await agent.login({
            identifier: account,
            password,
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
        <form className="flex w-[400px] flex-col gap-3 p-6">
            <h1 className="mx-2 text-lg">Enter your username and password</h1>

            <div className="relative mx-0 flex h-10 flex-grow items-center rounded-xl bg-lightBg px-3 text-main focus-within:border-fireflyBrand">
                <AtIcon width={18} height={18} className="shrink-0" />
                <input
                    type="text"
                    name="account"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={t`Username or email address`}
                    className="w-full border-0 bg-transparent py-2 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                    value={account}
                    onChange={(ev) => setAccount(ev.currentTarget.value)}
                />
            </div>
            <div className="relative mx-0 flex h-10 flex-grow items-center rounded-xl bg-lightBg px-3 text-main focus-within:border-fireflyBrand">
                <LockIcon width={18} height={18} className="shrink-0" />
                <input
                    type="password"
                    name="password"
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={t`Password`}
                    className="w-full border-0 bg-transparent py-2 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                    value={password}
                    onChange={(ev) => setPassword(ev.currentTarget.value)}
                />
            </div>
            <ClickableButton
                className="mt-1 flex h-[42px] w-full items-center justify-center rounded-md border border-line"
                disabled={loading || !account || !password}
                onClick={() => login(account, password)}
            >
                {loading ? <LoadingIcon className="text-main" /> : null}
                Login
            </ClickableButton>
        </form>
    );
}
