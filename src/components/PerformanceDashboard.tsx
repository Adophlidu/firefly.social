'use client';

import { ArrowDownTrayIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useState } from 'react';

import { CopyTextButton } from '@/components/CopyTextButton.js';
import { IconButton } from '@/components/IconButton.js';
import { isSameUrl } from '@/helpers/isSameUrl.js';
import { clearPerformanceData, exportPerformanceData, getPerformanceReport } from '@/providers/lcp/index.js';
import type { PerformanceReport } from '@/providers/lcp/types.js';

interface PerformanceDashboardProps {
    /** Show dashboard by default */
    defaultOpen?: boolean;
    /** Keyboard shortcut to toggle dashboard (e.g., 'p') */
    toggleKey?: string;
}

export function PerformanceDashboard({ defaultOpen = false, toggleKey = 'p' }: PerformanceDashboardProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [report, setReport] = useState<PerformanceReport | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [bubbleStatus, setBubbleStatus] = useState<{ count: number; color: string; hoverColor: string }>({
        count: 0,
        color: 'bg-green-600',
        hoverColor: 'hover:bg-green-700',
    });

    const refreshReport = useCallback(() => {
        const newReport = getPerformanceReport();
        setReport(newReport);

        // Calculate bubble status even when closed
        if (newReport) {
            const apiCallsBeforeLCP = newReport.apiCallsBeforeLCP || [];
            const highPriorityCount = apiCallsBeforeLCP.filter((call) => call.duration > 500).length;
            const mediumPriorityCount = apiCallsBeforeLCP.filter(
                (call) => call.duration > 100 && call.duration <= 500,
            ).length;

            if (highPriorityCount > 0) {
                setBubbleStatus({
                    count: highPriorityCount,
                    color: 'bg-red-600',
                    hoverColor: 'hover:bg-red-700',
                });
            } else if (mediumPriorityCount > 0) {
                setBubbleStatus({
                    count: 0,
                    color: 'bg-yellow-600',
                    hoverColor: 'hover:bg-yellow-700',
                });
            } else {
                setBubbleStatus({
                    count: 0,
                    color: 'bg-green-600',
                    hoverColor: 'hover:bg-green-700',
                });
            }
        }
    }, []);

    useEffect(() => {
        // Initial refresh
        refreshReport();

        // Refresh report periodically
        const interval = setInterval(refreshReport, 2000);

        return () => clearInterval(interval);
    }, [refreshReport]);

    // Ensure bubble is visible even on initial render
    useEffect(() => {
        // Force initial render of bubble status
        const initialReport = getPerformanceReport();
        if (initialReport) {
            const apiCallsBeforeLCP = initialReport.apiCallsBeforeLCP || [];
            const highPriorityCount = apiCallsBeforeLCP.filter((call) => call.duration > 500).length;
            const mediumPriorityCount = apiCallsBeforeLCP.filter(
                (call) => call.duration > 100 && call.duration <= 500,
            ).length;

            if (highPriorityCount > 0) {
                setBubbleStatus({
                    count: highPriorityCount,
                    color: 'bg-red-600',
                    hoverColor: 'hover:bg-red-700',
                });
            } else if (mediumPriorityCount > 0) {
                setBubbleStatus({
                    count: 0,
                    color: 'bg-yellow-600',
                    hoverColor: 'hover:bg-yellow-700',
                });
            }
        }
    }, []);

    useEffect(() => {
        if (!toggleKey) return;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === toggleKey && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [toggleKey]);

    const handleExport = useCallback(() => {
        const data = exportPerformanceData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lcp-performance-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, []);

    const handleClear = useCallback(() => {
        if (confirm('Clear all performance data?')) {
            clearPerformanceData();
            refreshReport();
        }
    }, [refreshReport]);

    // Always show the bubble button when dashboard is closed
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-4 right-4 z-[9999] rounded-full ${bubbleStatus.color} px-4 py-2 text-white shadow-lg ${bubbleStatus.hoverColor} transition-colors dark:shadow-primaryDark`}
                title={`Press Ctrl+${toggleKey.toUpperCase()} to toggle`}
            >
                <span className="relative z-10">LCP Perf</span>
                {bubbleStatus.count > 0 && (
                    <span className="absolute -right-2 -top-2 z-20 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow-md dark:bg-darkBottom dark:text-red-400">
                        {bubbleStatus.count}
                    </span>
                )}
            </button>
        );
    }

    // Show loading state when dashboard is open but no report yet
    if (!report) {
        return (
            <>
                <button
                    onClick={() => setIsOpen(false)}
                    className={`fixed bottom-4 right-4 z-50 rounded-full ${bubbleStatus.color} px-4 py-2 text-white shadow-lg ${bubbleStatus.hoverColor} dark:shadow-primaryDark`}
                    title={`Press Ctrl+${toggleKey.toUpperCase()} to toggle`}
                >
                    <span>LCP Perf</span>
                    {bubbleStatus.count > 0 && (
                        <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow-md dark:bg-darkBottom dark:text-red-400">
                            {bubbleStatus.count}
                        </span>
                    )}
                </button>
                <div className="fixed inset-4 z-50 overflow-auto rounded-lg bg-lightBottom text-lightMain shadow-2xl dark:bg-darkBottom dark:text-main dark:shadow-primaryDark">
                    <div className="flex h-full items-center justify-center">
                        <p className="text-lightMain dark:text-main">Loading performance data...</p>
                    </div>
                </div>
            </>
        );
    }

    const { summary, apiCallsBeforeLCP, duplicateGroups } = report;

    const filteredCalls = selectedDomain
        ? report.apiCalls.filter((call) => call.domain === selectedDomain)
        : report.apiCalls;

    // Create a map for quick duplicate lookup (for highlighting duplicates in API Calls table)
    // This maps call ID to duplicate count by matching calls to duplicate groups
    const duplicateCounts = new Map<string, number>();
    duplicateGroups.forEach((group) => {
        // Match calls by checking if they're in this duplicate group using isSameUrl
        report.apiCalls.forEach((call) => {
            if (call.method === group.method && isSameUrl(call.url, group.url)) {
                duplicateCounts.set(call.id, group.count);
            }
        });
    });

    const sortedCalls = [...filteredCalls].sort((a, b) => b.duration - a.duration);

    // Prioritize optimization targets: slow calls (>500ms) that happened before LCP
    const highPriorityCalls = apiCallsBeforeLCP.filter((call) => call.duration > 500);
    const mediumPriorityCalls = apiCallsBeforeLCP.filter((call) => call.duration > 100 && call.duration <= 500);
    const lowPriorityCalls = apiCallsBeforeLCP.filter((call) => call.duration <= 100);

    return (
        <div className="fixed inset-4 z-50 overflow-auto rounded-lg bg-lightBottom text-lightMain shadow-2xl dark:bg-darkBottom dark:text-main dark:shadow-primaryDark">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-lightBottom p-4 dark:border-secondaryLine dark:bg-darkBottom">
                <h2 className="text-xl font-bold text-lightMain dark:text-main">LCP Performance Dashboard</h2>
                <div className="flex gap-2">
                    <IconButton
                        onClick={handleExport}
                        tooltip="Export JSON"
                        className="rounded bg-secondarySuccess p-2 text-white transition-opacity hover:opacity-90 dark:hover:opacity-80"
                    >
                        <ArrowDownTrayIcon className="size-5" />
                    </IconButton>
                    <IconButton
                        onClick={handleClear}
                        tooltip="Clear"
                        className="rounded bg-danger p-2 text-white transition-opacity hover:opacity-90 dark:hover:opacity-80"
                    >
                        <TrashIcon className="size-5" />
                    </IconButton>
                    <IconButton
                        onClick={() => setIsOpen(false)}
                        tooltip="Close"
                        className="rounded bg-second p-2 text-white transition-opacity hover:opacity-90 dark:bg-third dark:hover:opacity-80"
                    >
                        <XMarkIcon className="size-5" />
                    </IconButton>
                </div>
            </div>

            <div className="p-4">
                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div className="rounded-lg border border-line p-4 dark:border-secondaryLine">
                        <div className="text-sm text-lightMain">Total API Calls</div>
                        <div className="text-2xl font-bold text-lightMain dark:text-main">{summary.totalCalls}</div>
                    </div>
                    <div className="rounded-lg border border-line p-4 dark:border-secondaryLine">
                        <div className="text-sm text-lightMain">Total Duration</div>
                        <div className="text-2xl font-bold text-lightMain dark:text-main">
                            {summary.totalDuration.toFixed(2)}ms
                        </div>
                    </div>
                    <div className="rounded-lg border border-line p-4 dark:border-secondaryLine">
                        <div className="text-sm text-lightMain">Avg Duration</div>
                        <div className="text-2xl font-bold text-lightMain dark:text-main">
                            {summary.averageDuration.toFixed(2)}ms
                        </div>
                    </div>
                    <div className="rounded-lg border border-line p-4 dark:border-secondaryLine">
                        <div className="text-sm text-lightMain">Calls Before LCP</div>
                        <div className="text-2xl font-bold text-lightMain dark:text-main">{summary.callsBeforeLCP}</div>
                        <div className="text-xs text-lightMain">
                            {summary.totalDurationBeforeLCP.toFixed(2)}ms total
                        </div>
                    </div>
                    <div className="border-purple-500/30 dark:border-purple-400/30 rounded-lg border p-4">
                        <div className="text-sm text-lightMain">Duplicate Requests</div>
                        <div className="text-purple-600 dark:text-purple-400 text-2xl font-bold">
                            {summary.totalDuplicateRequests}
                        </div>
                        <div className="text-xs text-lightMain">{summary.uniqueDuplicatePatterns} unique patterns</div>
                    </div>
                </div>

                {/* LCP Info */}
                {report.lcpTime ? (
                    <div className="mb-6 rounded-lg border border-warn/30 bg-warn/10 p-4 dark:border-warn/50 dark:bg-warn/20">
                        <div className="font-semibold text-warn dark:text-warn">
                            LCP (Largest Contentful Paint) Timing
                        </div>
                        <div className="text-sm text-warn/90 dark:text-warn">
                            LCP occurred at {report.lcpTime.toFixed(2)}ms after page load
                        </div>
                        <div className="mt-2 text-xs text-warn/80 dark:text-warn/90">
                            <strong>What is LCP?</strong> LCP measures when the largest content element (image, video,
                            or text block) becomes visible. API calls that complete <strong>before LCP</strong> (marked
                            with ✓) may be blocking or delaying page load and should be optimized first.
                        </div>
                    </div>
                ) : null}

                {/* Domain Breakdown */}
                <div className="mb-6">
                    <h3 className="mb-2 text-lg font-semibold text-lightMain dark:text-main">Calls by Domain</h3>
                    <div className="space-y-2">
                        {Object.entries(summary.callsByDomain)
                            .sort(([, a], [, b]) => b - a)
                            .map(([domain, count]) => (
                                <div
                                    key={domain}
                                    className={`flex cursor-pointer items-center justify-between rounded border p-2 transition-colors ${
                                        selectedDomain === domain
                                            ? 'border-link bg-link/10 dark:border-link dark:bg-link/20'
                                            : 'border-line hover:bg-bg dark:border-secondaryLine dark:hover:bg-bg'
                                    }`}
                                    onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                                >
                                    <div>
                                        <div className="font-medium text-lightMain dark:text-main">{domain}</div>
                                        <div className="text-sm text-lightMain">
                                            {count} calls • {summary.callsByDomainDuration[domain]?.toFixed(2) || '0'}ms
                                            total
                                        </div>
                                    </div>
                                    <div className="text-sm text-lightMain">
                                        {(summary.callsByDomainDuration[domain] / count).toFixed(2)}ms avg
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Duplicate GET Requests Table */}
                {duplicateGroups.length > 0 && (
                    <div className="mb-6">
                        <h3 className="mb-2 text-lg font-semibold text-lightMain dark:text-main">
                            Duplicate GET Requests
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-line dark:border-secondaryLine">
                                <thead>
                                    <tr className="bg-bg dark:bg-bg">
                                        <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                            Method
                                        </th>
                                        <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                            URL
                                        </th>
                                        <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                            Count
                                        </th>
                                        <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                            Total Duration
                                        </th>
                                        <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                            Avg Duration
                                        </th>
                                        <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                            Domain
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duplicateGroups.map((group) => (
                                        <tr key={group.url} className="transition-colors hover:bg-bg dark:hover:bg-bg">
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span
                                                    className={`rounded px-2 py-1 text-xs ${
                                                        group.method === 'GET'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : group.method === 'POST'
                                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {group.method}
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 font-mono text-xs text-lightMain dark:border-secondaryLine dark:text-main">
                                                <div className="flex items-center gap-2">
                                                    <div className="max-w-md flex-1 truncate" title={group.url}>
                                                        {group.url}
                                                    </div>
                                                    <CopyTextButton
                                                        text={group.url}
                                                        size={14}
                                                        className="shrink-0 text-lightMain hover:text-lightMain dark:hover:text-main"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded px-2 py-1 font-semibold">
                                                    {group.count}
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span className="text-lightMain dark:text-main">
                                                    {group.totalDuration.toFixed(2)}ms
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span
                                                    className={
                                                        group.averageDuration > 1000
                                                            ? 'font-bold text-danger dark:text-danger'
                                                            : group.averageDuration > 500
                                                              ? 'font-semibold text-warn dark:text-warn'
                                                              : 'text-lightMain dark:text-main'
                                                    }
                                                >
                                                    {group.averageDuration.toFixed(2)}ms
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 font-mono text-sm text-lightMain dark:border-secondaryLine dark:text-main">
                                                {group.domain}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* API Calls Table */}
                <div>
                    <h3 className="mb-2 text-lg font-semibold text-lightMain dark:text-main">
                        API Calls {selectedDomain ? `(${selectedDomain})` : ''}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-line dark:border-secondaryLine">
                            <thead>
                                <tr className="bg-bg dark:bg-bg">
                                    <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                        Method
                                    </th>
                                    <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                        URL
                                    </th>
                                    <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                        Duration
                                    </th>
                                    <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                        Start time
                                    </th>
                                    <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                        Status
                                    </th>
                                    <th
                                        className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main"
                                        title="Whether this API call completed before Largest Contentful Paint (LCP). Calls before LCP may delay page load."
                                    >
                                        Before LCP
                                    </th>
                                    <th className="border border-line p-2 text-left text-lightMain dark:border-secondaryLine dark:text-main">
                                        Domain
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCalls.map((call) => {
                                    const duplicateCount = duplicateCounts.get(call.id) || 0;
                                    const isDuplicate = duplicateCount > 1;
                                    return (
                                        <tr
                                            key={call.id}
                                            className={`transition-colors hover:bg-bg dark:hover:bg-bg ${
                                                call.beforeLCP ? 'bg-warn/10 dark:bg-warn/20' : ''
                                            } ${isDuplicate ? 'ring-purple-500/30 dark:ring-purple-400/30 ring-2' : ''}`}
                                        >
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span
                                                    className={`rounded px-2 py-1 text-xs ${
                                                        call.method === 'GET'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : call.method === 'POST'
                                                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {call.method}
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 font-mono text-xs text-lightMain dark:border-secondaryLine dark:text-main">
                                                <div className="flex items-center gap-2">
                                                    <div className="max-w-md flex-1 truncate" title={call.url}>
                                                        {call.url}
                                                    </div>
                                                    <CopyTextButton
                                                        text={call.url}
                                                        size={14}
                                                        className="shrink-0 text-lightMain hover:text-lightMain dark:hover:text-main"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span
                                                    className={
                                                        call.duration > 1000
                                                            ? 'font-bold text-danger dark:text-danger'
                                                            : call.duration > 500
                                                              ? 'font-semibold text-warn dark:text-warn'
                                                              : 'text-lightMain dark:text-main'
                                                    }
                                                >
                                                    {call.duration.toFixed(2)}ms
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span className="text-lightMain dark:text-main">
                                                    {call.startTime.toFixed(2)}ms
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                <span
                                                    className={
                                                        call.success
                                                            ? 'text-secondarySuccess dark:text-secondarySuccess'
                                                            : 'font-semibold text-danger dark:text-danger'
                                                    }
                                                >
                                                    {call.status}
                                                </span>
                                            </td>
                                            <td className="border border-line p-2 dark:border-secondaryLine">
                                                {call.beforeLCP ? (
                                                    <span
                                                        className="font-semibold text-warn dark:text-warn"
                                                        title="Completed before LCP - may be blocking page load"
                                                    >
                                                        ✓ Before LCP
                                                    </span>
                                                ) : call.lcpOffset !== undefined && call.lcpOffset !== null ? (
                                                    <span
                                                        className="text-lightMain"
                                                        title={`Completed ${Math.abs(call.lcpOffset).toFixed(0)}ms ${call.lcpOffset > 0 ? 'after' : 'before'} LCP`}
                                                    >
                                                        {call.lcpOffset > 0 ? '+' : ''}
                                                        {call.lcpOffset.toFixed(0)}ms
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="text-lightMain opacity-50 dark:text-third"
                                                        title="LCP not yet measured"
                                                    >
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                            <td className="border border-line p-2 font-mono text-sm text-lightMain dark:border-secondaryLine dark:text-main">
                                                {call.domain}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Optimization Priority Guide */}
                {apiCallsBeforeLCP.length > 0 && (
                    <div className="mt-6">
                        <div className="mb-4 rounded-lg border border-link/30 bg-link/10 p-4 dark:border-link/50 dark:bg-link/20">
                            <h3 className="mb-2 text-lg font-semibold text-link dark:text-link">
                                Optimization Priority Guide
                            </h3>
                            <div className="space-y-2 text-sm text-link/90 dark:text-link">
                                <p>
                                    <strong>Not all calls before LCP need optimization.</strong> Focus on:
                                </p>
                                <ul className="ml-4 list-disc space-y-1">
                                    <li>
                                        <strong className="text-danger dark:text-danger">High Priority</strong>{' '}
                                        (&gt;500ms): These are likely blocking LCP and should be optimized first
                                    </li>
                                    <li>
                                        <strong className="text-warn dark:text-warn">Medium Priority</strong>{' '}
                                        (100-500ms): Consider optimization if they're critical for initial render
                                    </li>
                                    <li>
                                        <strong className="text-lightMain">Low Priority</strong> (&lt;100ms): Usually
                                        fine, optimize only if they're blocking critical content
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* High Priority - Must Optimize */}
                        {highPriorityCalls.length > 0 && (
                            <div className="mb-4">
                                <h3 className="mb-2 text-lg font-semibold text-danger dark:text-danger">
                                    🔴 High Priority - Must Optimize ({highPriorityCalls.length})
                                </h3>
                                <p className="mb-2 text-sm text-lightMain">
                                    These slow calls (&gt;500ms) are likely blocking LCP and should be optimized first.
                                </p>
                                <div className="space-y-2">
                                    {highPriorityCalls
                                        .sort((a, b) => b.duration - a.duration)
                                        .map((call) => {
                                            const duplicateCount = duplicateCounts.get(call.id) || 0;
                                            const isDuplicate = duplicateCount > 1;
                                            return (
                                                <div
                                                    key={call.id}
                                                    className={`rounded border-2 p-3 ${
                                                        isDuplicate
                                                            ? 'border-purple-500/50 bg-purple-500/10 dark:border-purple-400/50 dark:bg-purple-400/10'
                                                            : 'border-danger/30 bg-danger/10 dark:border-danger/50 dark:bg-danger/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-danger dark:text-danger">
                                                                    {call.domain}
                                                                </span>
                                                                {isDuplicate ? (
                                                                    <span
                                                                        className="bg-purple-600 dark:bg-purple-500 rounded px-2 py-0.5 text-xs font-semibold text-white"
                                                                        title={`This request was made ${duplicateCount} times`}
                                                                    >
                                                                        {duplicateCount}x Duplicate
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="mt-1 break-all font-mono text-xs text-danger/90 dark:text-danger">
                                                                {call.method} {call.url}
                                                            </div>
                                                            {call.error ? (
                                                                <div className="mt-1 text-xs text-danger dark:text-danger/90">
                                                                    Error: {call.error}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                        <div className="ml-4 text-xl font-bold text-danger dark:text-danger">
                                                            {call.duration.toFixed(0)}ms
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Medium Priority */}
                        {mediumPriorityCalls.length > 0 && (
                            <div className="mb-4">
                                <h3 className="mb-2 text-lg font-semibold text-warn dark:text-warn">
                                    🟠 Medium Priority - Consider Optimizing ({mediumPriorityCalls.length})
                                </h3>
                                <p className="mb-2 text-sm text-lightMain">
                                    These calls (100-500ms) may impact LCP if they're critical for initial render.
                                </p>
                                <div className="space-y-2">
                                    {mediumPriorityCalls
                                        .sort((a, b) => b.duration - a.duration)
                                        .slice(0, 10)
                                        .map((call) => {
                                            const duplicateCount = duplicateCounts.get(call.id) || 0;
                                            const isDuplicate = duplicateCount > 1;
                                            return (
                                                <div
                                                    key={call.id}
                                                    className={`rounded border p-3 ${
                                                        isDuplicate
                                                            ? 'border-purple-500/50 bg-purple-500/10 dark:border-purple-400/50 dark:bg-purple-400/10'
                                                            : 'border-warn/30 bg-warn/10 dark:border-warn/50 dark:bg-warn/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-warn dark:text-warn">
                                                                    {call.domain}
                                                                </span>
                                                                {isDuplicate ? (
                                                                    <span
                                                                        className="bg-purple-600 dark:bg-purple-500 rounded px-2 py-0.5 text-xs font-semibold text-white"
                                                                        title={`This request was made ${duplicateCount} times`}
                                                                    >
                                                                        {duplicateCount}x Duplicate
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <div className="mt-1 break-all font-mono text-xs text-warn/90 dark:text-warn">
                                                                {call.method} {call.url}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 text-lg font-semibold text-warn dark:text-warn">
                                                            {call.duration.toFixed(0)}ms
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {mediumPriorityCalls.length > 10 && (
                                        <div className="text-sm text-lightMain">
                                            ... and {mediumPriorityCalls.length - 10} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Low Priority */}
                        {lowPriorityCalls.length > 0 && (
                            <div className="mb-4">
                                <h3 className="mb-2 text-lg font-semibold text-lightMain">
                                    ⚪ Low Priority - Usually Fine ({lowPriorityCalls.length})
                                </h3>
                                <p className="mb-2 text-sm text-lightMain">
                                    These fast calls (&lt;100ms) are typically fine, but optimize if they block critical
                                    content.
                                </p>
                                <details className="cursor-pointer">
                                    <summary className="text-sm text-lightMain transition-colors hover:text-lightMain dark:hover:text-main">
                                        Show {lowPriorityCalls.length} fast calls
                                    </summary>
                                    <div className="mt-2 space-y-1">
                                        {lowPriorityCalls
                                            .sort((a, b) => b.duration - a.duration)
                                            .slice(0, 20)
                                            .map((call) => (
                                                <div
                                                    key={call.id}
                                                    className="rounded border border-line bg-bg p-2 text-sm dark:border-secondaryLine dark:bg-bg"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-xs text-lightMain">
                                                            {call.domain}
                                                        </span>
                                                        <span className="text-lightMain">
                                                            {call.duration.toFixed(0)}ms
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
