'use client';

import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { Link } from '@/components/Activity/Link.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_TELEGRAM_URL } from '@/constants/index.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';

const VIEW_EXAMPLE_URL_EN = 'https://x.com/thefireflyapp/article/1929723999019548966';
const SUBMIT_FORM_URL_ZH =
    'https://docs.google.com/forms/d/e/1FAIpQLSe2RnsxdezPrhwB0hhqnzYHRMm1YhYwK4V3ED6JcqiYF1rWdg/viewform?pli=1%EF%BC%89%EF%BC%9B';
const SUBMIT_FORM_URL_EN =
    'https://docs.google.com/forms/d/e/1FAIpQLSdrT09V1NfErk14rhmXhcqhDcdvn87rnxe2wY73hzgL3t1ZYw/viewform';

export function ActivityCreatorTasks() {
    const {
        i18n: { locale },
    } = useLingui();

    const getViewExampleUrl = () => {
        if (locale === 'zh-Hans' || locale === 'zh-Hant') return resolvePostUrl(Source.Twitter, '1951211828844851450');
        return VIEW_EXAMPLE_URL_EN;
    };

    const getSubmitFormUrl = () => {
        if (locale === 'zh-Hans' || locale === 'zh-Hant') return SUBMIT_FORM_URL_ZH;
        return SUBMIT_FORM_URL_EN;
    };

    const getProfileUrl = () => {
        if (locale === 'zh-Hans' || locale === 'zh-Hant') {
            // return resolveProfileUrl(Source.Twitter, 'fireflyappcn');
            return '/profile/twitter/1891342077751123968';
        }
        // return resolveProfileUrl(Source.Twitter, 'thefireflyapp');
        return '/profile/twitter/1583361564479889408';
    };

    return (
        <div className="flex w-full flex-col items-center justify-center gap-6 px-6 pb-4 text-main">
            <div className="flex-1">
                <Trans>
                    Firefly is actively expanding its community presence, laying a strong foundation for future growth.
                    We welcome you to join as an early contributor, starting with our{' '}
                    <span className="font-bold">content bounty tasks</span>
                    !<br />
                    <br />
                    💰 Users who produce high-quality content can each earn <span className="font-bold">100 USDC</span>,
                    with winners <span className="font-bold">announced every two weeks</span>.<br />
                    <br />
                    🧩 Create a post on Firefly (thread / article / video, etc.) introducing Firefly. You can give a
                    broad overview or focus on the features you find most valuable. Submissions will be evaluated based
                    on content quality, creativity, depth, readability, and reach. Winners will be announced on{' '}
                    <Link trusted href={getProfileUrl()} className="text-highlight hover:underline" target="_blank">
                        @thefireflyapp
                    </Link>{' '}
                    and contacted via DM.
                    <Link trusted href={getViewExampleUrl()} className="text-highlight hover:underline" target="_blank">
                        【View Example】
                    </Link>
                    <br />
                    <br />
                    📌 How to participate:
                    <br />
                    <ol className="list-inside list-decimal">
                        <li>
                            <span className="font-bold">Create</span> Firefly-related content and publish it using the
                            Firefly crosspost feature (must include X).
                        </li>
                        <li>
                            <span className="font-bold">Follow & Mention</span>{' '}
                            <Link
                                trusted
                                href={getProfileUrl()}
                                className="text-highlight hover:underline"
                                target="_blank"
                            >
                                @thefireflyapp
                            </Link>
                            .
                        </li>
                        <li>
                            <span className="font-bold">Register</span> your submission by filling out this form.
                        </li>
                    </ol>
                </Trans>
            </div>

            <div className="flex w-72 items-center">
                <Link
                    href={getSubmitFormUrl()}
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
        </div>
    );
}
