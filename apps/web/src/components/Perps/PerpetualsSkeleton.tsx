import { classNames } from '@dimensiondev/utils';

import styles from '@/components/Perps/PerpsResponsive.module.css';

/**
 * Static placeholder for the Perpetuals route, rendered on the server. Used as the
 * `<Suspense>` fallback so the shell is always present in the initial HTML — even
 * if the route is ever statically rendered and `useSearchParams` in the page falls
 * back to client-side rendering for its subtree.
 */
function Block({ className }: { className?: string }) {
    return <div className={classNames('animate-pulse rounded bg-lightBg', className)} />;
}

const METRIC_KEYS = ['leverage', 'mark', 'oracle', 'change', 'volume', 'interest'] as const;
const BOOK_ROW_KEYS = ['b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9'] as const;
const PANEL_ROW_KEYS = ['p0', 'p1', 'p2'] as const;

export function PerpetualsSkeleton() {
    return (
        <div className={styles.shell}>
            <div
                aria-hidden
                role="status"
                className={classNames(styles.page, 'min-h-screen w-full overflow-x-hidden bg-primaryBottom')}
            >
                <header className={classNames(styles.pageHeader, 'flex items-center justify-between')}>
                    <Block className="h-6 w-28" />
                    <div className="flex items-center gap-2">
                        <Block className="h-9 w-16 max-sm:hidden" />
                        <Block className="h-8 w-20" />
                    </div>
                </header>

                <div className={classNames(styles.marketBar, 'border-b border-line')}>
                    <div className={styles.marketPrimary}>
                        <Block className="h-8 w-40 shrink-0" />
                        <Block className="h-8 w-20 shrink-0" />
                    </div>
                    <div className={styles.metricRail}>
                        {METRIC_KEYS.map((key) => (
                            <div key={key} className="flex shrink-0 flex-col gap-1 px-2">
                                <Block className="h-3 w-14" />
                                <Block className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.workspaceTabs}>
                    <Block className="m-1 h-7" />
                    <Block className="m-1 h-7" />
                </div>

                <div className={styles.workspace}>
                    <div className={classNames(styles.workspacePane, styles.workspacePaneActive)}>
                        <div
                            className={classNames(
                                styles.chart,
                                'flex min-w-0 flex-1 flex-col gap-3 border-b border-r border-line p-3',
                            )}
                        >
                            <Block className="h-8 w-full" />
                            <Block className="min-h-[300px] flex-1" />
                        </div>
                    </div>
                    <div className={styles.workspacePane}>
                        <div
                            className={classNames(
                                styles.orderBook,
                                'flex shrink-0 flex-col gap-3 border-y border-line p-3',
                            )}
                        >
                            <Block className="h-12 w-full bg-[#dcf1d9] dark:bg-[#284129]" />
                            <Block className="h-12 w-full bg-[#ffe6e4] dark:bg-[#502829]" />
                            <div className="mt-2 flex flex-col gap-1.5">
                                {BOOK_ROW_KEYS.map((key) => (
                                    <Block key={key} className="h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-3">
                    <div className="flex gap-8 border-b border-line pb-3">
                        <Block className="h-5 w-20" />
                        <Block className="h-5 w-24" />
                        <Block className="h-5 w-28" />
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                        {PANEL_ROW_KEYS.map((key) => (
                            <Block key={key} className="h-10 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
