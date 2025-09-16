'use client';

import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';

import { Link } from '@/components/Activity/Link.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_TELEGRAM_URL } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';

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
        <div className="flex w-full flex-col items-center justify-center gap-6 px-6 pb-4 text-main">
            <div className="flex-1">
                <p>
                    <Trans>
                        Firefly is actively expanding its community presence, laying a strong foundation for future
                        growth. We welcome you to join as an early contributor, starting with our{' '}
                        <span className="font-bold">content bounty tasks</span>!
                    </Trans>
                </p>
                <br />
                <p>
                    <Trans>
                        💰 Users who produce high-quality content can each earn{' '}
                        <span className="font-bold">100 USDC</span>, with winners{' '}
                        <span className="font-bold">announced every two weeks</span>.
                    </Trans>
                </p>
                <br />
                <p>
                    <Trans>
                        🧩 Create a post on Firefly (thread / article / video, etc.) introducing Firefly. You can give a
                        broad overview or focus on the features you find most valuable. Submissions will be evaluated
                        based on content quality, creativity, depth, readability, and reach. Winners will be announced
                        on{' '}
                        <Link trusted href={profileUrl} className="text-highlight hover:underline" target="_blank">
                            @thefireflyapp
                        </Link>{' '}
                        and contacted via DM.
                    </Trans>
                    <Link trusted href={exampleUrl} className="text-highlight hover:underline" target="_blank">
                        <Trans>【View Example】</Trans>
                    </Link>
                </p>
                <br />
                <p>
                    <Trans>📌 How to participate:</Trans>
                </p>
                <ol className="list-inside list-decimal">
                    <li>
                        <Trans>
                            <span className="font-bold">Create</span> Firefly-related content and publish it using the
                            Firefly crosspost feature (must include X).
                        </Trans>
                    </li>
                    <li>
                        <Trans>
                            <span className="font-bold">Follow & Mention</span>{' '}
                            <Link trusted href={profileUrl} className="text-highlight hover:underline" target="_blank">
                                @thefireflyapp
                            </Link>
                            .
                        </Trans>
                    </li>
                    <li>
                        <Trans>
                            <span className="font-bold">Register</span> your submission by filling out this form.
                        </Trans>
                    </li>
                </ol>
            </div>

            <div className="flex w-72 items-center">
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
                    fireflyBridgeProvider.supported && IS_ANDROID ? 'pb-safe-or-8' : 'pb-safe-or-4 max-md:pb-safe-or-2',
                )}
            />
        </div>
    );
}
