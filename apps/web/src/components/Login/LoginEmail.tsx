'use client';

import { Source } from '@dimensiondev/enums';
import EmailIcon from '@dimensiondev/assets/email2.svg';
import LockIcon from '@dimensiondev/assets/lock.svg';
import { AbortError, ForbiddenError } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SendPasscodeButton } from '@/components/Login/SendPasscodeButton.js';
import { AsyncStatus } from '@/constants/enum.js';
import { FireflyAlreadyBoundError } from '@/constants/error.js';
import { EMAIL_REGEX } from '@/constants/regexp.js';
import {
    enqueueForbiddenMessage,
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/LoginModal/refs.js';
import { createAccountByPasscode } from '@/providers/email/createAccountByPasscode.js';
import type { ThirdPartySession } from '@/providers/third-party/Session.js';
import { thirdPartySessionHolder } from '@/providers/third-party/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { type AccountOptions, addAccount } from '@/services/account.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

async function loginEmail(
    createAccount: () => Promise<Account>,
    {
        setAsyncStatus,
        ...options
    }: Omit<AccountOptions, 'source'> & {
        setAsyncStatus: (source: Source.Email, status: AsyncStatus) => void;
    },
) {
    try {
        const account = await createAccount();
        const done = await addAccount(account, {
            ...options,
            async setAsCurrent({ session }) {
                setAsyncStatus(Source.Email, AsyncStatus.Pending);
                thirdPartySessionHolder.resumeSession(session as ThirdPartySession);
                setAsyncStatus(Source.Email, AsyncStatus.Idle);
            },
        });
        if (done) {
            enqueueSuccessMessage(<Trans>Your email is now connected.</Trans>);
        }
        LoginModalRef.close();
    } catch (error) {
        if (AbortError.is(error)) return;
        if (error instanceof ForbiddenError) {
            enqueueForbiddenMessage();
            return;
        }
        if (error instanceof FireflyAlreadyBoundError) {
            enqueueWarningMessage(<Trans>This Email is already linked</Trans>);
            return;
        }
        if (error instanceof Error) {
            enqueueMessageFromError(error, <Trans>Connection failed. {error.message}</Trans>);
            return;
        }
        throw error;
    }
}

export function LoginEmail() {
    const controller = useAbortController();
    const { setAsyncStatus } = useGlobalState();
    const [email, setEmail] = useState('');
    const [passcode, setPasscode] = useState('');

    const emailRef = useRef<HTMLInputElement>(null);
    const passcodeRef = useRef<HTMLInputElement>(null);

    const isValidEmail = EMAIL_REGEX.test(email);
    const isValidPasscode = passcode.length === 6 && passcode.match(/^\d+$/);

    const [{ loading }, login] = useAsyncFn(async () => {
        controller.current.renew();
        if (!isValidEmail) {
            enqueueWarningMessage(<Trans>Sorry, the email you entered is invalid</Trans>);
            return;
        }

        if (!isValidPasscode) {
            enqueueWarningMessage(<Trans>Sorry, the passcode you entered is invalid</Trans>);
            return;
        }

        await loginEmail(() => createAccountByPasscode(email, passcode), {
            setAsyncStatus,
            signal: controller.current.signal,
        });
    }, [controller, email, passcode, isValidEmail, isValidPasscode, setAsyncStatus]);

    return (
        <form className="box-border flex w-[452px] flex-col items-center gap-[20px] px-6 pb-6 max-md:w-full">
            <h2 className="text-second text-center text-xs">
                <Trans>
                    Enter your email address below, and we’ll send a one-time passcode to confirm your address
                </Trans>
            </h2>
            <div className="flex w-[300px] flex-col gap-5 max-md:w-full">
                <div className="bg-lightBg text-main ring-highlight group relative mx-0 flex h-10 grow items-center overflow-hidden rounded-xl focus-within:bg-bottom focus-within:ring-1">
                    <EmailIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        ref={emailRef}
                        disabled={loading}
                        type="text"
                        name="account"
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Your email address`}
                        className="placeholder:text-secondary dark:text-input w-full border-0 bg-transparent py-2 pl-9 focus:border-0 focus:outline-0 focus:ring-0 sm:text-sm sm:leading-6"
                        value={email}
                        onChange={(ev) => setEmail(ev.currentTarget.value)}
                    />
                    {email ? (
                        <ClearButton
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                setEmail('');
                                emailRef.current?.focus();
                            }}
                        />
                    ) : null}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <div className="bg-lightBg text-main ring-highlight group relative mx-0 flex h-10 grow items-center overflow-hidden rounded-xl focus-within:bg-bottom focus-within:ring-1">
                        <LockIcon width={18} height={18} className="absolute left-3 shrink-0" />
                        <input
                            ref={passcodeRef}
                            disabled={loading}
                            type="password"
                            name="password"
                            autoComplete="off"
                            spellCheck="false"
                            placeholder={t`One-time passcode`}
                            className="placeholder:text-secondary dark:text-input w-full border-0 bg-transparent py-2 pl-9 focus:border-0 focus:outline-0 focus:ring-0 sm:text-sm sm:leading-6"
                            value={passcode}
                            onChange={(ev) => setPasscode(ev.currentTarget.value)}
                        />
                        {passcode ? (
                            <ClearButton
                                type="button"
                                className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                                IconProps={{
                                    className: 'group-hover:text-highlight group-focus-within:text-highlight',
                                }}
                                size={16}
                                onClick={() => {
                                    setPasscode('');
                                    passcodeRef.current?.focus();
                                }}
                            />
                        ) : null}
                    </div>
                    <SendPasscodeButton email={email} disabled={!email || !isValidEmail} />
                </div>
                <ClickableButton
                    className="border-line bg-lightMain text-primaryBottom flex h-[42px] w-full items-center justify-center gap-1 rounded-full border"
                    disabled={loading || !email || !passcode || !isValidEmail || !isValidPasscode}
                    onClick={() => login()}
                    aria-label="Connect email"
                >
                    {loading ? (
                        <>
                            <Trans>Connecting</Trans>
                            <LoadingIcon className="text-primaryBottom size-[18px]" />
                        </>
                    ) : (
                        <Trans>Connect</Trans>
                    )}
                </ClickableButton>
            </div>
        </form>
    );
}
