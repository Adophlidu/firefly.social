import { parseJson, parseUrl } from '@dimensiondev/utils';
import { first, isEmpty } from 'lodash-es';

import { FetchError } from '@/constants/error.js';
import { createErrorResponseJson, createSuccessResponseJson } from '@/helpers/createResponseJson.js';
import { parseHtml } from '@/helpers/parseHtml.js';
import type { ParagraphChain } from '@/providers/paragraph/type.js';

interface State {
    props: {
        pageProps: {
            collectible: {
                chain: ParagraphChain;
                noteId: string;
                supply: string;
                costEth: string;
                position: {
                    from: number;
                    to: number;
                };
                contractAddress: string;
                text: string;
                collectorWallet: string;
            };

            initialState: {
                notes: {
                    allNotes: Array<{
                        highlightsSupply: string;
                        highlightsCost: number;
                        highlightsChain: ParagraphChain;
                        id: string;
                        post_preview: string;
                        title: string;
                        collectibleWalletAddress: string;
                    }>;
                };
                blog: {
                    blog: {
                        url?: string;
                        user: {
                            wallet_address?: string;
                            referrerWalletAddress?: string;
                        };
                        highlightsCost?: number;
                        highlightsChain?: string;
                        collectibleWalletAddress?: string;
                    };
                };
            };
        };
    };
}

class Processor {
    async digestDocumentUrl(documentUrl: string, signal?: AbortSignal) {
        const url = parseUrl(documentUrl);
        if (!url) return null;

        const response = await fetch(url, { signal });
        if (!response.ok || (response.status >= 500 && response.status < 600)) throw FetchError.from(url, response);

        const html = await response.text();

        const document = parseHtml(html);
        const dataScript = document.getElementById('__NEXT_DATA__');
        const data = dataScript?.innerText ? parseJson<State>(dataScript.innerText) : undefined;

        if (isEmpty(data?.props.pageProps.collectible)) {
            const target = first(data?.props.pageProps.initialState.notes.allNotes);
            if (!target)
                return createErrorResponseJson(`Failed to parse state from document = ${documentUrl}.`, {
                    status: 500,
                });

            const result = {
                chain:
                    target.highlightsChain ?? data?.props.pageProps.initialState.blog.blog.highlightsChain ?? 'polygon',
                noteId: target.id,
                supply: target.highlightsSupply,
                costEth: target.highlightsCost ?? data?.props.pageProps.initialState.blog.blog.highlightsCost,
                text: target.title,
                collectorWallet:
                    target.collectibleWalletAddress ??
                    data?.props.pageProps.initialState.blog.blog.collectibleWalletAddress ??
                    data?.props.pageProps.initialState.blog.blog.user.wallet_address,
                position: {
                    from: 0,
                    to: 0,
                },
                symbol: data?.props.pageProps.initialState.blog.blog.url?.replace('@', '').toUpperCase(),
                referrerAddress: data?.props.pageProps.initialState.blog.blog.user.referrerWalletAddress,
            };

            return createSuccessResponseJson(result);
        }

        const result = {
            ...data?.props.pageProps.collectible,
            symbol: data?.props.pageProps.initialState.blog.blog.url?.replace('@', '').toUpperCase(),
            referrerAddress: data?.props.pageProps.initialState.blog.blog.user.referrerWalletAddress,
        };

        return createSuccessResponseJson(result);
    }
}

export const ParagraphProcessor = new Processor();
