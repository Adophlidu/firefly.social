/// @vitest-environment node

// React #419 ("the server could not finish this Suspense boundary") is a server-rendering-
// only failure: when a <Suspense> boundary suspends on the server and the underlying task
// rejects with no enclosing error boundary, React can't finish the boundary, reports the
// error, and falls back to client rendering — the client then observes #419. jsdom tests
// render on the client, where the same rejection surfaces as an error boundary / unhandled
// rejection instead, so this path can only be exercised with a real server streaming render
// (renderToReadableStream in a Node env).
//
// This test reproduces that server-side path and proves the fix: wrapping the rejecting
// subtree in <NoSSR> (foxact noSSR(), which throws BAILOUT_TO_CLIENT_SIDE_RENDERING on the
// server) keeps the rejecting query from ever running server-side. See
// SocialProfileContentList.tsx (Feed branch, `if (!initialFeedPage)`) for the application.

import { QueryClient, QueryClientProvider, useSuspenseQuery } from '@tanstack/react-query';
import { createElement, type ReactNode, Suspense } from 'react';
import { renderToReadableStream } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { NoSSR } from '@/components/NoSSR.js';

// Mirrors FeedList's behaviour when the prefetched page is missing and the feed endpoint
// rejects: a suspending query that rejects on the server.
function RejectingFeedList() {
    useSuspenseQuery({
        queryKey: ['posts', 'reject'],
        queryFn: async () => {
            throw new Error('feed endpoint rejected (brem1/gabetonic)');
        },
    });
    return null;
}

function Tree({ children }: { children: ReactNode }) {
    return createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(Suspense, { fallback: 'loading' }, children),
    );
}

describe('server-side Suspense rejection (React #419 mechanism)', () => {
    test('a rejecting suspending query with no error boundary surfaces a server error', async () => {
        const errors: unknown[] = [];
        const stream = await renderToReadableStream(createElement(Tree, null, createElement(RejectingFeedList)), {
            onError: (error) => {
                errors.push(error);
            },
        });
        await stream.allReady;

        // The query rejected inside a Suspense boundary with no error boundary, so React can't
        // finish it on the server and reports the error via onError — the condition the client
        // observes as React #419.
        expect(errors.map(String).join('\n')).toMatch(/feed endpoint rejected/);
    });

    test('NoSSR keeps the rejecting query from running on the server', async () => {
        const errors: unknown[] = [];
        const stream = await renderToReadableStream(
            createElement(Tree, null, createElement(NoSSR, null, createElement(RejectingFeedList))),
            {
                onError: (error) => {
                    errors.push(error);
                },
            },
        );
        await stream.allReady;

        // noSSR() bails out on the server, so RejectingFeedList never renders there and its
        // feed query never runs. (The bare react-dom/server renderer reports the benign
        // BAILOUT digest via onError — Next's renderer swallows it — but the feed rejection
        // itself must be gone.)
        expect(errors.map(String).join('\n')).not.toMatch(/feed endpoint rejected/);
    });
});
