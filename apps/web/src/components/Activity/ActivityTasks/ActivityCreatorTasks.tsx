'use client';

import { FIREFLY_TELEGRAM_URL } from '@dimensiondev/constants/static';
import { Source } from '@dimensiondev/enums';
import { nativeBridgeProvider } from '@dimensiondev/native-bridge';
import { classNames } from '@dimensiondev/utils';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { Link } from '@/components/Activity/Link.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';

const VIEW_EXAMPLE_URL_EN = 'https://x.com/thefireflyapp/article/1929723999019548966';
const SUBMIT_FORM_URL_ZH =
    'https://docs.google.com/forms/d/e/1FAIpQLSe2RnsxdezPrhwB0hhqnzYHRMm1YhYwK4V3ED6JcqiYF1rWdg/viewform?pli=1%EF%BC%89%EF%BC%9B';
const SUBMIT_FORM_URL_EN =
    'https://docs.google.com/forms/d/e/1FAIpQLSdrT09V1NfErk14rhmXhcqhDcdvn87rnxe2wY73hzgL3t1ZYw/viewform';

export function ActivityCreatorTasks() {
    const {
        i18n: { locale },
    } = useLingui();

    const isChinese = locale === 'zh-Hans' || locale === 'zh-Hant';
    const { exampleUrl, formUrl, profileUrl } = useMemo(
        () => ({
            exampleUrl: isChinese ? resolvePostUrl(Source.Twitter, '1951211828844851450') : VIEW_EXAMPLE_URL_EN,
            formUrl: isChinese ? SUBMIT_FORM_URL_ZH : SUBMIT_FORM_URL_EN,
            profileUrl: resolveProfileUrl(Source.Twitter, isChinese ? 'fireflyappcn' : 'thefireflyapp'),
        }),
        [isChinese],
    );

    return (
        <div className="flex w-full flex-col gap-6 px-6 pb-4 text-main">
            <Trans>
                <p>
                    Firefly is launching <span className="font-bold">Polymarket trading</span>, connecting onchain
                    prediction markets with your social feed! We welcome you to join as an early contributor, starting
                    with our <span className="font-bold">content bounty tasks</span>!
                </p>
                <p>
                    💰 Users who produce high-quality content can each earn <span className="font-bold">100 USDC</span>.
                </p>
                <p>
                    🧩 Create a post on Firefly to share your Polymarket trading story. You can talk about your
                    predictions, trading strategies, insights, successes, or even failures on Polymarket. Submissions
                    will be evaluated based on content quality, creativity, depth, readability, and reach. Winners will
                    be announced on{' '}
                    <Link trusted href={profileUrl} className="text-highlight hover:underline" target="_blank">
                        @thefireflyapp
                    </Link>{' '}
                    and contacted via DM.
                </p>
                <p>📌 How to participate:</p>
                <ol className="list-inside list-decimal">
                    <li>
                        <span className="font-bold">Create</span> an article or long thread sharing your{' '}
                        <span className="font-bold">Polymarket trading story</span>, and publish it on any social
                        platform supported by Firefly.
                    </li>
                    <li>
                        <span className="font-bold">Follow & Mention</span>{' '}
                        <Link trusted href={profileUrl} className="text-highlight hover:underline" target="_blank">
                            @thefireflyapp
                        </Link>
                        .
                    </li>
                    <li>
                        <span className="font-bold">Register</span> your submission by filling out this form.
                    </li>
                </ol>
            </Trans>

            <div className="mx-auto flex w-72 items-center">
                <Link
                    href={formUrl}
                    trusted
                    className="flex flex-1 flex-col items-center gap-2 rounded-lg p-2.5 font-bold outline outline-1 outline-offset-[-1px] outline-main"
                    target="_blank"
                >
                    <Trans>Open Google Form</Trans>
                </Link>
            </div>

            <div className="w-full text-center text-[10px]">
                <Trans>
                    For any inquiries, please{' '}
                    <Link href={FIREFLY_TELEGRAM_URL} target="_blank" className="inline text-highlight">
                        contact us
                    </Link>
                    . All rights reserved by Firefly.
                </Trans>
            </div>
            <div
                className={classNames(
                    nativeBridgeProvider.supported && IS_ANDROID ? 'pb-safe-or-8' : 'pb-safe-or-4 max-md:pb-safe-or-2',
                )}
            />
        </div>
    );
}
