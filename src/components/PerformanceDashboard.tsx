'use client';

/**
 * LCP Performance Dashboard
 *
 * A visual dashboard for viewing API performance metrics and identifying bottlenecks affecting LCP.
 *
 * Usage:
 * - Add this component to your app (e.g., in development mode or behind a feature flag)
 * - Access via keyboard shortcut or URL parameter
 */

import { useCallback, useEffect, useState } from 'react';

import { CopyTextButton } from '@/components/CopyTextButton.js';
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
                className={`fixed bottom-4 right-4 z-[9999] rounded-full ${bubbleStatus.color} px-4 py-2 text-white shadow-lg ${bubbleStatus.hoverColor} transition-colors`}
                title={`Press Ctrl+${toggleKey.toUpperCase()} to toggle`}
            >
                <span className="relative z-10">LCP Perf</span>
                {bubbleStatus.count > 0 && (
                    <span className="absolute -right-2 -top-2 z-20 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow-md">
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
                    className={`fixed bottom-4 right-4 z-50 rounded-full ${bubbleStatus.color} px-4 py-2 text-white shadow-lg ${bubbleStatus.hoverColor}`}
                    title={`Press Ctrl+${toggleKey.toUpperCase()} to toggle`}
                >
                    <span>LCP Perf</span>
                    {bubbleStatus.count > 0 && (
                        <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow-md">
                            {bubbleStatus.count}
                        </span>
                    )}
                </button>
                <div className="fixed inset-4 z-50 overflow-auto rounded-lg bg-white text-black shadow-2xl">
                    <div className="flex h-full items-center justify-center">
                        <p>Loading performance data...</p>
                    </div>
                </div>
            </>
        );
    }

    const { summary, apiCallsBeforeLCP } = report;
    const filteredCalls = selectedDomain
        ? report.apiCalls.filter((call) => call.domain === selectedDomain)
        : report.apiCalls;

    const sortedCalls = [...filteredCalls].sort((a, b) => b.duration - a.duration);

    // Prioritize optimization targets: slow calls (>500ms) that happened before LCP
    const highPriorityCalls = apiCallsBeforeLCP.filter((call) => call.duration > 500);
    const mediumPriorityCalls = apiCallsBeforeLCP.filter((call) => call.duration > 100 && call.duration <= 500);
    const lowPriorityCalls = apiCallsBeforeLCP.filter((call) => call.duration <= 100);

    // Determine bubble color and badge count
    const highPriorityCount = highPriorityCalls.length;
    const mediumPriorityCount = mediumPriorityCalls.length;

    let bubbleBgColor = 'bg-green-600';
    let bubbleHoverColor = 'hover:bg-green-700';
    let badgeText = '';

    if (highPriorityCount > 0) {
        bubbleBgColor = 'bg-red-600';
        bubbleHoverColor = 'hover:bg-red-700';
        badgeText = highPriorityCount.toString();
    } else if (mediumPriorityCount > 0) {
        bubbleBgColor = 'bg-yellow-600';
        bubbleHoverColor = 'hover:bg-yellow-700';
        badgeText = '';
    }

    return (
        <div className="fixed inset-4 z-50 overflow-auto rounded-lg bg-white text-black shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
                <h2 className="text-xl font-bold">LCP Performance Dashboard</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                    >
                        Export JSON
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded bg-gray-600 px-3 py-1 text-white hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>

            <div className="p-4">
                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Total API Calls</div>
                        <div className="text-2xl font-bold">{summary.totalCalls}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Total Duration</div>
                        <div className="text-2xl font-bold">{summary.totalDuration.toFixed(2)}ms</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Avg Duration</div>
                        <div className="text-2xl font-bold">{summary.averageDuration.toFixed(2)}ms</div>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="text-sm text-gray-600">Calls Before LCP</div>
                        <div className="text-2xl font-bold">{summary.callsBeforeLCP}</div>
                        <div className="text-xs text-gray-500">{summary.totalDurationBeforeLCP.toFixed(2)}ms total</div>
                    </div>
                </div>

                {/* LCP Info */}
                {report.lcpTime ? (
                    <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                        <div className="font-semibold text-yellow-800">LCP (Largest Contentful Paint) Timing</div>
                        <div className="text-sm text-yellow-700">
                            LCP occurred at {report.lcpTime.toFixed(2)}ms after page load
                        </div>
                        <div className="mt-2 text-xs text-yellow-600">
                            <strong>What is LCP?</strong> LCP measures when the largest content element (image, video,
                            or text block) becomes visible. API calls that complete <strong>before LCP</strong> (marked
                            with ✓) may be blocking or delaying page load and should be optimized first.
                        </div>
                    </div>
                ) : null}

                {/* Domain Breakdown */}
                <div className="mb-6">
                    <h3 className="mb-2 text-lg font-semibold">Calls by Domain</h3>
                    <div className="space-y-2">
                        {Object.entries(summary.callsByDomain)
                            .sort(([, a], [, b]) => b - a)
                            .map(([domain, count]) => (
                                <div
                                    key={domain}
                                    className={`flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-gray-50 ${
                                        selectedDomain === domain ? 'border-blue-500 bg-blue-50' : ''
                                    }`}
                                    onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                                >
                                    <div>
                                        <div className="font-medium">{domain}</div>
                                        <div className="text-sm text-gray-500">
                                            {count} calls • {summary.callsByDomainDuration[domain]?.toFixed(2) || '0'}ms
                                            total
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {(summary.callsByDomainDuration[domain] / count).toFixed(2)}ms avg
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* API Calls Table */}
                <div>
                    <h3 className="mb-2 text-lg font-semibold">
                        API Calls {selectedDomain ? `(${selectedDomain})` : ''}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Method</th>
                                    <th className="border p-2 text-left">URL</th>
                                    <th className="border p-2 text-left">Duration</th>
                                    <th className="border p-2 text-left">Status</th>
                                    <th
                                        className="border p-2 text-left"
                                        title="Whether this API call completed before Largest Contentful Paint (LCP). Calls before LCP may delay page load."
                                    >
                                        Before LCP
                                    </th>
                                    <th className="border p-2 text-left">Domain</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCalls.map((call) => (
                                    <tr
                                        key={call.id}
                                        className={`hover:bg-gray-50 ${call.beforeLCP ? 'bg-yellow-50' : ''}`}
                                    >
                                        <td className="border p-2">
                                            <span
                                                className={`rounded px-2 py-1 text-xs ${
                                                    call.method === 'GET'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : call.method === 'POST'
                                                          ? 'bg-green-100 text-green-800'
                                                          : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {call.method}
                                            </span>
                                        </td>
                                        <td className="border p-2 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="max-w-md flex-1 truncate" title={call.url}>
                                                    {call.url}
                                                </div>
                                                <CopyTextButton
                                                    text={call.url}
                                                    size={14}
                                                    className="shrink-0 text-gray-500 hover:text-gray-700"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </td>
                                        <td className="border p-2">
                                            <span
                                                className={
                                                    call.duration > 1000
                                                        ? 'font-bold text-red-600'
                                                        : call.duration > 500
                                                          ? 'font-semibold text-orange-600'
                                                          : ''
                                                }
                                            >
                                                {call.duration.toFixed(2)}ms
                                            </span>
                                        </td>
                                        <td className="border p-2">
                                            <span
                                                className={
                                                    call.success ? 'text-green-600' : 'font-semibold text-red-600'
                                                }
                                            >
                                                {call.status}
                                            </span>
                                        </td>
                                        <td className="border p-2">
                                            {call.beforeLCP ? (
                                                <span
                                                    className="font-semibold text-yellow-600"
                                                    title="Completed before LCP - may be blocking page load"
                                                >
                                                    ✓ Before LCP
                                                </span>
                                            ) : call.lcpOffset !== undefined && call.lcpOffset !== null ? (
                                                <span
                                                    className="text-gray-500"
                                                    title={`Completed ${Math.abs(call.lcpOffset).toFixed(0)}ms ${call.lcpOffset > 0 ? 'after' : 'before'} LCP`}
                                                >
                                                    {call.lcpOffset > 0 ? '+' : ''}
                                                    {call.lcpOffset.toFixed(0)}ms
                                                </span>
                                            ) : (
                                                <span className="text-gray-400" title="LCP not yet measured">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                        <td className="border p-2 font-mono text-sm">{call.domain}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Optimization Priority Guide */}
                {apiCallsBeforeLCP.length > 0 && (
                    <div className="mt-6">
                        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                            <h3 className="mb-2 text-lg font-semibold text-blue-900">Optimization Priority Guide</h3>
                            <div className="space-y-2 text-sm text-blue-800">
                                <p>
                                    <strong>Not all calls before LCP need optimization.</strong> Focus on:
                                </p>
                                <ul className="ml-4 list-disc space-y-1">
                                    <li>
                                        <strong className="text-red-600">High Priority</strong> (&gt;500ms): These are
                                        likely blocking LCP and should be optimized first
                                    </li>
                                    <li>
                                        <strong className="text-orange-600">Medium Priority</strong> (100-500ms):
                                        Consider optimization if they're critical for initial render
                                    </li>
                                    <li>
                                        <strong className="text-gray-600">Low Priority</strong> (&lt;100ms): Usually
                                        fine, optimize only if they're blocking critical content
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* High Priority - Must Optimize */}
                        {highPriorityCalls.length > 0 && (
                            <div className="mb-4">
                                <h3 className="mb-2 text-lg font-semibold text-red-800">
                                    🔴 High Priority - Must Optimize ({highPriorityCalls.length})
                                </h3>
                                <p className="mb-2 text-sm text-gray-600">
                                    These slow calls (&gt;500ms) are likely blocking LCP and should be optimized first.
                                </p>
                                <div className="space-y-2">
                                    {highPriorityCalls
                                        .sort((a, b) => b.duration - a.duration)
                                        .map((call) => (
                                            <div
                                                key={call.id}
                                                className="rounded border-2 border-red-300 bg-red-50 p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-red-900">{call.domain}</div>
                                                        <div className="mt-1 break-all font-mono text-xs text-red-700">
                                                            {call.method} {call.url}
                                                        </div>
                                                        {call.error ? (
                                                            <div className="mt-1 text-xs text-red-600">
                                                                Error: {call.error}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    <div className="ml-4 text-xl font-bold text-red-600">
                                                        {call.duration.toFixed(0)}ms
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Medium Priority */}
                        {mediumPriorityCalls.length > 0 && (
                            <div className="mb-4">
                                <h3 className="mb-2 text-lg font-semibold text-orange-800">
                                    🟠 Medium Priority - Consider Optimizing ({mediumPriorityCalls.length})
                                </h3>
                                <p className="mb-2 text-sm text-gray-600">
                                    These calls (100-500ms) may impact LCP if they're critical for initial render.
                                </p>
                                <div className="space-y-2">
                                    {mediumPriorityCalls
                                        .sort((a, b) => b.duration - a.duration)
                                        .slice(0, 10)
                                        .map((call) => (
                                            <div
                                                key={call.id}
                                                className="rounded border border-orange-300 bg-orange-50 p-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-orange-900">{call.domain}</div>
                                                        <div className="mt-1 font-mono text-xs text-orange-700">
                                                            {call.method} {call.url}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 text-lg font-semibold text-orange-600">
                                                        {call.duration.toFixed(0)}ms
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    {mediumPriorityCalls.length > 10 && (
                                        <div className="text-sm text-gray-500">
                                            ... and {mediumPriorityCalls.length - 10} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Low Priority */}
                        {lowPriorityCalls.length > 0 && (
                            <div className="mb-4">
                                <h3 className="mb-2 text-lg font-semibold text-gray-700">
                                    ⚪ Low Priority - Usually Fine ({lowPriorityCalls.length})
                                </h3>
                                <p className="mb-2 text-sm text-gray-600">
                                    These fast calls (&lt;100ms) are typically fine, but optimize if they block critical
                                    content.
                                </p>
                                <details className="cursor-pointer">
                                    <summary className="text-sm text-gray-600 hover:text-gray-800">
                                        Show {lowPriorityCalls.length} fast calls
                                    </summary>
                                    <div className="mt-2 space-y-1">
                                        {lowPriorityCalls
                                            .sort((a, b) => b.duration - a.duration)
                                            .slice(0, 20)
                                            .map((call) => (
                                                <div
                                                    key={call.id}
                                                    className="rounded border border-gray-200 bg-gray-50 p-2 text-sm"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-mono text-xs text-gray-600">
                                                            {call.domain}
                                                        </span>
                                                        <span className="text-gray-500">
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
