export enum ParagraphChain {
    Optimism = 'optimism',
    Base = 'base',
    Zora = 'zora',
    Polygon = 'polygon',
}

export interface ParagraphContentJson {
    type: string;
    attrs?: {
        tweetData?: {
            video?: {
                poster: string;
                variants: Array<{ type: string; src: string }>;
            };
        };
    };
    content: Array<{
        attrs?: {
            nextheight?: number;
            nextwidth?: number;
            src: string;
        };
    }>;
}

export interface ParagraphPageState {
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
