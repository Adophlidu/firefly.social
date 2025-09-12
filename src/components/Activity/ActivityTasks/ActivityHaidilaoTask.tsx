/* cspell:disable */

'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import ArrowRightIcon from '@/assets/arrow-right.svg';
import { Link } from '@/components/Activity/Link.js';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { IS_ANDROID } from '@/constants/browser.js';
import { Source } from '@/constants/enum.js';
import { FIREFLY_TELEGRAM_URL } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';

interface TaskItemProps {
    title: React.ReactNode;
    primaryAction: React.ReactNode;
    secondaryAction?: React.ReactNode;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
    completed?: boolean;
}

interface ProductDetailRowProps {
    label: React.ReactNode;
    value: React.ReactNode;
}

function ProductDetailRow({ label, value }: ProductDetailRowProps) {
    return (
        <>
            <div className="text-sm font-semibold text-main">{label}</div>
            <div className="text-sm text-main">{value}</div>
        </>
    );
}

function TaskItem({
    title,
    primaryAction,
    secondaryAction,
    onPrimaryClick,
    onSecondaryClick,
    completed,
}: TaskItemProps) {
    const handlePrimaryClick = () => {
        enqueueSuccessMessage(<Trans>Activity not started yet</Trans>);
        onPrimaryClick?.();
    };

    const handleSecondaryClick = () => {
        enqueueSuccessMessage(<Trans>Activity not started yet</Trans>);
        onSecondaryClick?.();
    };

    return (
        <div className="rounded-2xl bg-bg p-3">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-main">{title}</span>
                </div>
                <div className="flex items-start gap-3">
                    <ClickableButton
                        onClick={handlePrimaryClick}
                        className={classNames(
                            'h-8 rounded-2xl px-4 text-xs font-bold leading-8',
                            completed ? 'bg-success text-primaryBottom' : 'bg-main text-primaryBottom',
                        )}
                    >
                        {primaryAction}
                    </ClickableButton>
                    {secondaryAction ? (
                        <ClickableButton
                            onClick={handleSecondaryClick}
                            className="h-8 rounded-2xl border border-current px-4 text-xs font-bold leading-8 text-main"
                        >
                            {secondaryAction}
                        </ClickableButton>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export function ActivityHaidilaoTask() {
    const tasks = [
        {
            title: (
                <Trans>
                    Follow{' '}
                    <Link
                        className="text-highlight"
                        href={resolveProfileUrl(Source.Twitter, 'thefireflyapp')}
                        target="_blank"
                    >
                        @thefireflyapp
                    </Link>{' '}
                    on X
                </Trans>
            ),
            primaryAction: <Trans>Follow</Trans>,
            secondaryAction: <Trans>Refresh</Trans>,
        },
        {
            title: <Trans>Join Firefly&rsquo;s Telegram community</Trans>,
            primaryAction: <Trans>Join</Trans>,
            secondaryAction: <Trans>Refresh</Trans>,
        },
        {
            title: <Trans>Repost the official campaign post</Trans>,
            primaryAction: <Trans>Repost</Trans>,
            secondaryAction: <Trans>Refresh</Trans>,
        },
        {
            title: <Trans>Cross-post to invite your crew to join (Optional)</Trans>,
            primaryAction: <Trans>Post</Trans>,
            secondaryAction: <Trans>Refresh</Trans>,
        },
        {
            title: <Trans>Connect your wallet to Firefly (Optional)</Trans>,
            primaryAction: <Trans>Connect</Trans>,
        },
        {
            title: <Trans>Connect your email to Firefly (Optional)</Trans>,
            primaryAction: <Trans>Connect</Trans>,
        },
    ];

    return (
        <div className="flex flex-col gap-4 px-6 pb-4">
            <div className="space-y-8 text-sm text-main">
                <div>
                    <h3 className="mb-2 text-lg font-bold">
                        <Trans>About the Festival</Trans>
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <Trans>👀 Foodie builders, listen up!</Trans>
                        </li>
                        <li>
                            <Trans>
                                This October, join us at Haidilao Singapore for the first-ever Web3 Hotpot Festival — a
                                week of hotpot, networking, and fun.
                            </Trans>
                            <br />
                            <br />
                        </li>
                        <li>
                            <Trans>
                                📅 <span className="font-bold">Dates:</span> Sept 30 – Oct 6, 2025
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                📍 <span className="font-bold">Locations:</span> Marina Bay Sands, Bugis+, Marina Square
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                🔥 <span className="font-bold">Unlock up to SGD50 Haidilao dining vouchers</span> by
                                completing Firefly social tasks (from just US$15 — or{' '}
                                <span className="font-bold">even free!</span>).
                            </Trans>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-2 text-lg font-bold">
                        <Trans>Special On-Site Event</Trans>
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Trans>
                                As part of the festival, join us on-site at Marina Bay Sands Haidilao for an afternoon
                                of Web3 + lifestyle experiences:
                            </Trans>
                            <br />
                            <br />
                        </li>
                        <li>
                            <Trans>
                                📅 <span className="font-bold">Date/ Time:</span> Oct 1, 3:30–6:30 PM
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                📍 <span className="font-bold">Location:</span> Marina Bay Sands
                            </Trans>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-2 text-lg font-bold">
                        <Trans>What to Expect</Trans>
                    </h3>
                    <ul className="space-y-1">
                        <li>
                            <Trans>
                                🎟 Complete more Firefly tasks to unlock{' '}
                                <span className="font-bold">free hotpot vouchers</span> or extra discount voucher
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                💺 <span className="font-bold">Exclusive seat booking</span> at Haidilao and additional
                                discounted dishes of your choice
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                🤝 Meet and connect with <span className="font-bold">Top 10 Asian Web3 teams</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                📸 Snap photos and connect with <span className="font-bold">well-known KOLs</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                💅 Enjoy <span className="font-bold">a free manicure</span> session at our NFC Nail Art
                                booth brought to you together with Chipped
                            </Trans>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col border-t border-line pt-4">
                <h3 className="mb-4 text-lg font-bold text-main">
                    <Trans>Product Detail</Trans>
                </h3>
                <div
                    className="grid gap-2"
                    style={{
                        gridTemplateColumns: 'auto 1fr',
                    }}
                >
                    <ProductDetailRow label={<Trans>Product</Trans>} value={<Trans>Voucher SGD 50 x 1</Trans>} />
                    <ProductDetailRow label={<Trans>Period</Trans>} value={<Trans>Sept 30 – Oct 6</Trans>} />
                    <ProductDetailRow
                        label={<Trans>Rules</Trans>}
                        value={<Trans>1 voucher can be redeemed by 1 person; No limit for dining guests</Trans>}
                    />
                    <ProductDetailRow label={<Trans>Support</Trans>} value={<Trans>No refund if expired</Trans>} />
                    <>
                        <div className="text-sm font-semibold text-main">
                            <Trans>Stores</Trans>
                        </div>
                        <Menu as="div" className="relative flex items-center">
                            <MenuButton className="flex items-center gap-0.5 transition-opacity hover:opacity-80">
                                <span className="text-sm text-main">
                                    <Trans>Valid at 3 Stores</Trans>
                                </span>
                                <ArrowRightIcon width={10} height={10} />
                            </MenuButton>
                            <MenuItems className="absolute left-0 z-10 mt-2 w-48 rounded-lg bg-primaryBottom py-3 text-main shadow-primary focus:outline-none">
                                <MenuItem>
                                    <a
                                        href="https://maps.app.goo.gl/775Lf22Gdwy4mszt6"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-1 text-base font-normal hover:opacity-80"
                                    >
                                        <Trans>Marina Bay Sands</Trans>
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="https://maps.app.goo.gl/CNCgARJEWbGtcYj48"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-1 text-base font-normal hover:opacity-80"
                                    >
                                        <Trans>Bugis+</Trans>
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="https://maps.app.goo.gl/5sxX9ETjmZhHk9VL8"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-3 py-1 text-base font-normal hover:opacity-80"
                                    >
                                        <Trans>Marina Square</Trans>
                                    </a>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </>
                </div>

                <Image
                    width={1140}
                    height={450}
                    src="/image/activity/haidilao/product-detail.png"
                    alt="product-details"
                    className="mt-4 h-auto w-full"
                    style={{
                        aspectRatio: '1140 / 450',
                    }}
                />
            </div>

            {/* Divider */}
            <div className="border-t border-line" />

            {/* Tasks Section */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-bold text-main">
                    <Trans>Completed tasks (0/3)</Trans>
                </h2>

                <div className="rounded-lg border border-success/20 bg-success/10 p-2">
                    <ul className="list-outside list-disc space-y-1 pl-4 text-xs leading-none text-success">
                        <li>
                            <Trans>
                                Complete the <span className="font-bold">3 basic tasks</span> below to activate your
                                voucher and get a S$50 Haidilao dining voucher{' '}
                                <span className="font-bold">for US$15</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>
                                The more tasks you complete, the better your chances to unlock{' '}
                                <span className="font-bold">exclusive discounts</span> or even{' '}
                                <span className="font-bold">free hotpot vouchers</span>
                            </Trans>
                        </li>
                        <li>
                            <Trans>The final amount is subject to the actual order amount</Trans>
                        </li>
                    </ul>
                </div>

                <div className="flex flex-col gap-4">
                    {tasks.map((task, index) => (
                        <TaskItem
                            key={index}
                            title={task.title}
                            primaryAction={task.primaryAction}
                            secondaryAction={task.secondaryAction}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                disabled
            >
                <Trans>Upcoming</Trans>
            </button>
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
