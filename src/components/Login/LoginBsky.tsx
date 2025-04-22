/* cspell:disable */

import { zodResolver } from '@hookform/resolvers/zod';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { delay } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAsyncFn } from 'react-use';
import urlcat from 'urlcat';
import * as z from 'zod';

import AtIcon from '@/assets/at.svg';
import GlobalIcon from '@/assets/global.svg';
import LockIcon from '@/assets/lock.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ClearButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { DEFAULT_SERVICE_URL } from '@/constants/bsky.js';
import { AsyncStatus, Source } from '@/constants/enum.js';
import { AbortError } from '@/constants/error.js';
import { classNames } from '@/helpers/classNames.js';
import {
    enqueueMessageFromError,
    enqueueSuccessMessage,
    enqueueWarningMessage,
} from '@/helpers/enqueueMessage.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAbortController } from '@/hooks/useAbortController.js';
import { LoginModalRef } from '@/modals/controls.js';
import { BskySession } from '@/providers/bsky/Session.js';
import { bskySessionHolder, createAgentOnce } from '@/providers/bsky/SessionHolder.js';
import type { Account } from '@/providers/types/Account.js';
import { HttpsUrl, HttpUrl } from '@/schemas/index.js';
import { type AccountOptions, addAccount } from '@/services/account.js';
import { bindOrRestoreFireflySession } from '@/services/bindOrRestoreFireflySession.js';
import { useGlobalState } from '@/store/useGlobalStore.js';

async function loginBsky(createAccount: () => Promise<Account>, options?: Omit<AccountOptions, 'source'>) {
    try {
        const account = await createAccount();
        const done = await addAccount(account, {
            ...options,
            async setAsCurrent({ session }) {
                useGlobalState.getState().setAsyncStatus(Source.Bsky, AsyncStatus.Pending);
                await bskySessionHolder.resumeSession(session as BskySession, false);
                useGlobalState.getState().setAsyncStatus(Source.Bsky, AsyncStatus.Idle);
            },
        });
        if (done) {
            enqueueSuccessMessage(t`Your ${resolveSourceName(Source.Bsky)} account is now connected.`);
        }

        LoginModalRef.close();
    } catch (error) {
        // skip if the error is abort error
        if (AbortError.is(error)) return;

        throw error;
    }
}

const schema = z.object({
    account: z.string().min(1),
    password: z.string().min(1),
    serviceUrl: z.union([HttpsUrl, z.literal('')]).optional(),
});

const serverDescriptionScheme = z.object({
    did: z.string(),
    availableUserDomains: z.array(z.string()),
    inviteCodeRequired: z.boolean().optional(),
    phoneVerificationRequired: z.boolean().optional(),
    links: z
        .object({
            privacyPolicy: HttpUrl.optional(),
            termsOfService: HttpUrl.optional(),
        })
        .optional(),
    contact: z
        .object({
            email: z.string().optional(),
        })
        .optional(),
});

export function LoginBsky() {
    const controller = useAbortController();

    const { register, handleSubmit, watch, formState, resetField, setFocus } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        defaultValues: {
            account: '',
            password: '',
            serviceUrl: DEFAULT_SERVICE_URL,
        },
    });

    const [editServiceUrl, setEditServiceUrl] = useState(false);

    const { account, password, serviceUrl } = watch();

    const [{ loading }, login] = useAsyncFn(
        async (username: string, password: string, serviceUrl: string) => {
            controller.current.renew();
            try {
                await loginBsky(
                    async () => {
                        const agent = createAgentOnce(serviceUrl);
                        const response = await agent.login({
                            identifier: username,
                            password,
                        });
                        if (!response.success) throw new Error(`Failed to login username = ${username}.`);

                        const profileResponse = await agent.getProfile(
                            {
                                actor: response.data.did,
                            },
                            {
                                signal: controller.current.signal,
                            },
                        );
                        if (!profileResponse.success)
                            throw new Error(`Failed to get profile id = ${response.data.did}.`);

                        const now = Date.now();
                        const session = new BskySession(response.data.did, now, now, serviceUrl, {
                            active: true,
                            ...response.data,
                        });

                        const fireflySession = await bindOrRestoreFireflySession(session, controller.current.signal);

                        return {
                            session,
                            profile: formatBskyProfile(profileResponse.data),
                            fireflySession,
                        } satisfies Account;
                    },
                    {
                        signal: controller.current.signal,
                    },
                );
            } catch (error) {
                if (error instanceof Error && error.message === 'Invalid identifier or password') {
                    enqueueWarningMessage(t`Sorry, the username or password you entered is incorrect`);
                    setFocus('account');
                    return;
                }
                enqueueMessageFromError(error, t`Oops… Something went wrong. Please try again`);
                throw error;
            }
        },
        [controller, setFocus],
    );

    const { data: serverDescription, isLoading } = useQuery({
        enabled: !!serviceUrl && !editServiceUrl,
        queryKey: ['login-bsky', serviceUrl, editServiceUrl],
        queryFn: async ({ queryKey, signal }) => {
            const [, url, editServiceUrl] = queryKey as [string, string, boolean];
            if (!url) return false;
            if (editServiceUrl) return false;

            // default service url
            if (url === DEFAULT_SERVICE_URL) return true;

            const u = parseUrl(url);
            if (!u) return false;

            const parsed = HttpsUrl.safeParse(url);
            if (!parsed.success) return false;

            try {
                const description = await fetchJSON<z.infer<typeof serverDescriptionScheme>>(
                    urlcat(url, '/xrpc/com.atproto.server.describeServer'),
                    {
                        signal,
                    },
                );

                return description;
            } catch (error) {
                if (AbortError.is(error)) return false;

                enqueueWarningMessage(t`Sorry, the provider you entered is invalid`);
                throw error;
            }
        },
        retry: false,
    });

    return (
        <form
            className="box-border flex w-[500px] flex-col items-center gap-3 p-6 max-md:w-full"
            onSubmit={handleSubmit((form) => {
                login(form.account, form.password, form.serviceUrl || DEFAULT_SERVICE_URL);
            })}
        >
            <div className="flex w-[300px] flex-col gap-5 max-md:w-full">
                <h1 className="whitespace-nowrap text-xs text-second max-md:whitespace-normal">
                    <Trans>Enter your username and password to sign in instantly</Trans>
                </h1>

                <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <AtIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        disabled={loading}
                        type="text"
                        autoFocus
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Username or email address`}
                        className="w-full border-0 bg-transparent py-2 pl-9 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        {...register('account', { required: true })}
                    />
                    {account ? (
                        <ClearButton
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                resetField('account');
                                setFocus('account');
                            }}
                        />
                    ) : null}
                </div>
                <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <LockIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        disabled={loading}
                        type="password"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={t`Password`}
                        className="w-full border-0 bg-transparent py-2 pl-9 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6"
                        {...register('password', { required: true })}
                    />
                    {password ? (
                        <ClearButton
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={() => {
                                resetField('password');
                                setFocus('password');
                            }}
                        />
                    ) : null}
                </div>
                <div className="group relative mx-0 flex h-10 flex-grow items-center overflow-hidden rounded-xl bg-lightBg text-main ring-highlight focus-within:bg-bottom focus-within:ring-1">
                    <GlobalIcon width={18} height={18} className="absolute left-3 shrink-0" />
                    <input
                        disabled={loading}
                        type="text"
                        autoComplete="off"
                        spellCheck="false"
                        placeholder={DEFAULT_SERVICE_URL}
                        className={classNames(
                            'w-full border-0 bg-transparent py-2 pl-9 placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6',
                            {
                                'pointer-events-none opacity-0': !editServiceUrl,
                            },
                        )}
                        onFocus={() => {
                            setEditServiceUrl(true);
                        }}
                        {...register('serviceUrl', {
                            required: true,
                            onBlur: () => {
                                setEditServiceUrl(false);
                            },
                        })}
                    />
                    <span
                        className={classNames(
                            'absolute w-full border-0 bg-transparent py-2 pl-9 text-left placeholder-secondary focus:border-0 focus:outline-0 focus:ring-0 dark:text-input sm:text-sm sm:leading-6',
                            {
                                hidden: editServiceUrl,
                            },
                        )}
                        onClick={async () => {
                            setEditServiceUrl(true);
                            await delay(300);
                            setFocus('serviceUrl');
                        }}
                    >
                        {parseUrl(serviceUrl || DEFAULT_SERVICE_URL)?.hostname}
                    </span>

                    {serviceUrl ? (
                        <ClearButton
                            tabIndex={-1}
                            type="button"
                            className="absolute right-3 hidden group-focus-within:inline-block group-hover:inline-block"
                            IconProps={{ className: 'group-hover:text-highlight group-focus-within:text-highlight' }}
                            size={16}
                            onClick={async () => {
                                resetField('serviceUrl');
                                setEditServiceUrl(true);
                                await delay(300);
                                setFocus('serviceUrl');
                            }}
                        />
                    ) : null}
                </div>
                <ClickableButton
                    className="flex h-[42px] w-full items-center justify-center gap-1 rounded-full border border-line bg-lightMain text-primaryBottom"
                    disabled={
                        loading ||
                        isLoading ||
                        formState.isSubmitting ||
                        !formState.isValid ||
                        (!!serviceUrl && !serverDescription)
                    }
                    type="submit"
                >
                    {loading ? (
                        <>
                            <Trans>Signing in</Trans>
                            <LoadingIcon className="size-[18px] text-primaryBottom" />
                        </>
                    ) : (
                        <Trans>Sign in</Trans>
                    )}
                </ClickableButton>
            </div>
        </form>
    );
}
