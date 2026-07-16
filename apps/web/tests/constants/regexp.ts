import { first } from 'lodash-es';
import { describe, expect, it } from 'vitest';

import { LINK_MARK_RE } from '@/constants/linkRegExp.js';
import {
    BSKY_MENTION_REGEX,
    CHANNEL_REGEX,
    FARCASTER_MENTION_REGEX,
    LENS_MENTION_REGEX,
    MENTION_REGEX,
    SYMBOL_REGEX,
    URL_INPUT_REGEX,
    URL_REGEX,
} from '@/constants/regexp.js';

function matchUrl(regExp: RegExp) {
    return () => {
        const cases = [
            [
                `
                    I almost never re-read any of my own writing
    
                    But there's one exception: this "Part Time Degen" essay
            
                    TLDR I tried to capture all my pain, seethe, mistakes & cope from the last crypto cycle in one spot
            
                    Check it out 👇 https://benroy.beehiiv.com/p/parttime-degen-notes-speculation-crypto-markets-20192022
                `,
                'https://benroy.beehiiv.com/p/parttime-degen-notes-speculation-crypto-markets-20192022',
            ],
            [
                `
                    hat matures, we're excited about supporting efforts to enshrine account abstraction into the protocol itself (e.g. 3074) — we prefer
                `,
                null,
            ],
            [
                `
                    {
                        "p": "XRC20",
                        "op": "deploy",
                        "tick": "𝐅",
                        "max": "21000000",
                        "lim": "2000"
                    }
                    app.twitscription.xyz/tokens?v=2&mint=𝐅
                    🌔🍰📂😇🚑
                    https://frames.twitscription.xyz
                `,
                'app.twitscription.xyz/tokens?v=2&mint=𝐅',
            ],
            [
                `
                    Geth v1.13.14 out, featuring minor blob pool polishes and the reduction of the blob pool capacity from 10GB to 2.5GB to avoid unexpected surprises during/after the Cancun fork.
                `,
                null,
            ],
            [
                'Update not critical, but recommended. https://github.com/ethereum/go-ethereum/releases/tag/v1.13.14',
                'https://github.com/ethereum/go-ethereum/releases/tag/v1.13.14',
            ],
            [
                `@lens/ris_707 - dance cult\n\nhttps://hey.xyz/posts/0x042e3c-0x01-DA-95038467\n\n#visualsound\n`,
                'https://hey.xyz/posts/0x042e3c-0x01-DA-95038467',
            ],
            [
                'the article can be read here:\nhttps://paragraph.xyz/@nfa/wildcard-reflections',
                'https://paragraph.xyz/@nfa/wildcard-reflections',
            ],
            [
                `
                This is what we mean by "build a hammer that is a tool you buy once and it's yours, not a corposlop AI dishwasher that requires you to register for a google account and charges a subscription fee per month for extra washing modes, and probably spies on you and stops working if you get politically disfavored by a foreign country".

                If you think this criticism of corposlop is hyperbolic, well turns out, it's literally a concatenation of these three:

                * https://mein-mmo.de/en/user-buys-new-dishwasher-can-only-use-some-features-if-he-subscribes,1186249/
                In 2014, decentralized applications were toys, hundreds of times more difficult to use in web2. In 2026, fileverse is now usable enough that I regularly write documents in it and send them to other people to collaborate. The decentralized renaissance is coming, and you can be part of making it happen.
                `,
                'https://mein-mmo.de/en/user-buys-new-dishwasher-can-only-use-some-features-if-he-subscribes,1186249/',
            ],
            ['Visit https://foo.bar, and continue', 'https://foo.bar'],
            ['Check https://foo.bar,abc for more info', 'https://foo.bar'],
            ['Go to https://foo.bar/, now', 'https://foo.bar/'],
            ['See https://foo.bar/,abc for details', 'https://foo.bar/,abc'],
            ['URL ending with comma: https://foo.bar/,', 'https://foo.bar/'],
            ['URL with comma in path: https://example.com/path,123/end', 'https://example.com/path,123/end'],
            ['URL with comma before space: https://test.com/page, text after', 'https://test.com/page'],
            ['URL with comma in query: https://site.com?param,value', 'https://site.com?param,value'],
            // URL with balanced parentheses in the path (e.g. cell.com DOI-style paths)
            [
                'https://www.cell.com/cell/fulltext/S0092-8674(26)00505-2',
                'https://www.cell.com/cell/fulltext/S0092-8674(26)00505-2',
            ],
            [
                'Read this https://www.cell.com/cell/fulltext/S0092-8674(26)00505-2 today',
                'https://www.cell.com/cell/fulltext/S0092-8674(26)00505-2',
            ],
            // URL wrapped in parentheses: interior paren kept, trailing paren dropped
            [
                'see (https://www.cell.com/cell/fulltext/S0092-8674(26)00505-2)',
                'https://www.cell.com/cell/fulltext/S0092-8674(26)00505-2',
            ],
        ] as Array<[string, string | null]>;

        cases.forEach(([input, expectedOutput]) => {
            regExp.lastIndex = 0;

            const [matched] = input.match(regExp) ?? [null];
            expect(matched).toBe(expectedOutput);
        });
    };
}

function matchCorrectUrl(regExp: RegExp) {
    return () => {
        const cases = [
            [
                `
                    I almost never re-read any of my own writing

                    But there's one exception: this "Part Time Degen" essay
            
                    TLDR I tried to capture all my pain, seethe, mistakes & cope from the last crypto cycle in one spot
            
                    Check it out 👇 https://benroy.beehiiv.com/p/parttime-degen-notes-speculation-crypto-markets-20192022 some text after link
                `,
                'https://benroy.beehiiv.com/p/parttime-degen-notes-speculation-crypto-markets-20192022',
            ],
            [
                `
                    {
                        "p": "XRC20",
                        "op": "deploy",
                        "tick": "𝐅",
                        "max": "21000000",
                        "lim": "2000"
                    }
                    app.twitscription.xyz/tokens?v=2&mint=𝐅
                    🌔🍰📂😇🚑
                    https://frames.twitscription.xyz                
                `,
                'app.twitscription.xyz/tokens?v=2&mint=𝐅',
            ],
            [
                `Update not critical, but recommended. https://github.com/ethereum/go-ethereum/releases/tag/v1.13.14`,
                'https://github.com/ethereum/go-ethereum/releases/tag/v1.13.14',
            ],
            [
                `jesse just called this the most consequential consumer web3 product in last five years. 

                "- fully non-custodial
                - fully open source (http://github.com/coinbase/smart-wallet)
                - supporting best-in-class standards (e.g. 4337)"
                
                thank u @wilsoncusack`,
                'http://github.com/coinbase/smart-wallet',
            ],
            [
                `This is a post made with firefly.social/, which posts to farcaster and lens at the same time.

                Alternative clients are important, we should support them!`,
                'firefly.social/',
            ],
            [
                'Random thought about AI n web3\nhttps://paragraph.xyz/@kellyan.eth\nChief Decentralisation Officer@Opencord AI',
                'https://paragraph.xyz/@kellyan.eth',
            ],
            [
                'mint your score on https://lensreputation.xyz?referral=W2CKDOF5 (hurry, so you still can get the genesis badge!)',
                'https://lensreputation.xyz?referral=W2CKDOF5',
            ],
            [
                'mint your score on https://lensreputation.xyz/a/b/c?referral=W2CKDOF5 (hurry, so you still can get the genesis badge!)',
                'https://lensreputation.xyz/a/b/c?referral=W2CKDOF5',
            ],
            [
                'mint your score on https://lensreputation.xyz/a/b/c/?referral=W2CKDOF5 (hurry, so you still can get the genesis badge!)',
                'https://lensreputation.xyz/a/b/c/?referral=W2CKDOF5',
            ],
            [
                `
                This is what we mean by "build a hammer that is a tool you buy once and it's yours, not a corposlop AI dishwasher that requires you to register for a google account and charges a subscription fee per month for extra washing modes, and probably spies on you and stops working if you get politically disfavored by a foreign country".

                If you think this criticism of corposlop is hyperbolic, well turns out, it's literally a concatenation of these three:

                * https://mein-mmo.de/en/user-buys-new-dishwasher-can-only-use-some-features-if-he-subscribes,1186249/
                In 2014, decentralized applications were toys, hundreds of times more difficult to use in web2. In 2026, fileverse is now usable enough that I regularly write documents in it and send them to other people to collaborate. The decentralized renaissance is coming, and you can be part of making it happen.
                `,
                'https://mein-mmo.de/en/user-buys-new-dishwasher-can-only-use-some-features-if-he-subscribes,1186249/',
            ],
            // Test cases for comma handling
            ['Visit https://foo.bar, and continue', 'https://foo.bar'],
            ['Check https://foo.bar,abc for more info', 'https://foo.bar'],
            ['Go to https://foo.bar/, now', 'https://foo.bar/'],
            ['See https://foo.bar/,abc for details', 'https://foo.bar/,abc'],
            ['URL ending with comma: https://foo.bar/,', 'https://foo.bar/'],
            ['URL with comma in path: https://example.com/path,123/end', 'https://example.com/path,123/end'],
            ['URL with comma before space: https://test.com/page, text after', 'https://test.com/page'],
            ['URL with comma in query: https://site.com?param,value', 'https://site.com?param,value'],
        ];

        cases.forEach(([input, expectedOutput]) => {
            regExp.lastIndex = 0;

            const result = first(input.match(regExp) || []);
            expect(result).toBe(expectedOutput);
        });
    };
}

describe('MENTION_REGEXP', () => {
    it('should match a mention', () => {
        const cases = [
            ['@handle', '@handle'],
            ['handle', null],
            ['handle@', null],
            ['handle @', null],
            ['@handle_name', '@handle_name'],
            ['handle @name', '@name'],
            ['@handle.lens', '@handle.lens'],
            ['@lens/handle', '@lens/handle'],
            ['@club/handle', '@club/handle'],
            ['@yup_io', '@yup_io'],
            ['@corbansteward.base.eth', '@corbansteward.base.eth'],
            ['@user.name', '@user.name'],
            [['This is message', 'with a @mention'].join('\n'), '@mention'],
        ] as Array<[string, string | null]>;

        cases.forEach(([input, expectedOutput]) => {
            // reset the regex
            MENTION_REGEX.lastIndex = 0;

            const [matched] = input.match(MENTION_REGEX) ?? [null];
            expect(matched).toBe(expectedOutput);
        });
    });
});

describe('URL_REGEX', () => {
    it('should match a url', matchUrl(URL_REGEX));

    it('should match correct url', matchCorrectUrl(URL_REGEX));
});

describe('LINK_MARK_RE', () => {
    it('should match a url', matchUrl(LINK_MARK_RE));

    it('should match conrrect url', matchCorrectUrl(LINK_MARK_RE));
});

describe('CHANNEL_REGEX', () => {
    it('should match a channel handle', () => {
        const cases = [
            ['/Bitcoin', null],
            ['/BitCoin', null],
            ['/bitCoin', null],
            ['/bitcoin', '/bitcoin'],
            ['/bitcoin2', '/bitcoin2'],
            ['/bitcoin/2', null],
            ['prefix /bitcoin suffix', ' /bitcoin'],
            ['prefix/bitcoin suffix', null],
            ['prefix /bitcoinMASK', null],
            ['prefix /bitcoin面具', ' /bitcoin'],
            ['prefix /bitcoin🎭', ' /bitcoin'],
            ['/firefly-garden', '/firefly-garden'],
            ['/firefly-garden2', '/firefly-garden2'],
            ['/2024', '/2024'],
            ['/2024-bitcoin', '/2024-bitcoin'],
            ['/2024a', '/2024a'],
            ['/2024MASK', null],
            ['/2024面具', '/2024'],
            ['/2024🎭', '/2024'],
            ['/2024/05', null],
            ['/2024/05/05', null],
            ['/2024-05-05', '/2024-05-05'],
        ] as Array<[string, string | null]>;

        cases.forEach(([input, expectedOutput]) => {
            CHANNEL_REGEX.lastIndex = 0;
            const [matched] = input.match(CHANNEL_REGEX) ?? [null];
            expect(matched).toBe(expectedOutput);
        });
    });
});

describe('SYMBOL_REGEX', () => {
    it('should match a symbol tag', () => {
        const cases = [
            ['$mask', '$mask'],
            ['$;;,', null],
            ['$@#', null],
            ['$123', '$123'], // We can't exclude all-number tags, but they will be handle inside <SymbolTag />
            ['$1inch', '$1inch'],
            [' $1inch', ' $1inch'],
            [' $大牛', ' $大牛'],
        ] as Array<[string, string | null]>;

        cases.forEach(([input, expectedOutput]) => {
            const [matched] = input.match(SYMBOL_REGEX) ?? [null];
            expect(matched).toBe(expectedOutput);
        });
    });
});

describe('URL_SINGLE_REGEX', () => {
    it('should match valid URLs', () => {
        [
            'http://example.com',
            'https://example.com',
            'https://www.example.com',
            'https://example.com:8080',
            'https://example.com/path/to/resource',
            'https://example.com/path/to/resource?query=param',
            'https://example.com/path/to/resource#fragment',
            'https://sub.example.com',
            'https://example.com/path/to/resource?query=param&another=param',
            'https://example.com/path/to/resource#fragment',
            'https://example.com:8080/path?query=param#fragment',
            'https://example.co.uk',
            'https://example.travel',
            'https://example.com/path/to/resource?query=param&key=value',
            'https://example.com/path/to/resource/with/trailing/slash/', // Trailing slash
            'https://example.com/path/to/resource?query=param&key=value&key2=value2', // Multiple query parameters
            'https://example.com/path/to/resource#fragment?query=param', // Fragment before query
        ].forEach((url) => {
            expect(URL_INPUT_REGEX.test(url), `url: ${url}`).toBe(true);
        });
    });

    it('should not match invalid URLs', () => {
        [
            ' https://example.com',
            ' https://example.com ',
            'example.com',
            'https://example', // Missing TLD
            'https://.com', // Invalid domain
            'https://example.com/path/to/ resource', // Space in path
            'ftp://example.com', // Wrong protocol
            'https://.example.com', // Leading dot in domain
            'https://example..com', // Double dots in domain
            'https://example.com/path/to/ resource?query=param#fragment', // Space in path
            'https://example.c', // Short TLD
            'https://-example.com', // Leading hyphen in domain
            'https://localhost', // Localhost without port
            'https://localhost:3000', // Localhost with port
            'https://localhost/path', // Localhost with path
            'https://localhost/path/to/resource?query=param', // Localhost with path and query
            'https://user:password@example.com', // User info in URL
        ].forEach((url) => {
            expect(URL_INPUT_REGEX.test(url)).toBe(false);
        });
    });
});

describe('BSKY_MENTION_REGEX', () => {
    it('should match bsky mention', () => {
        const cases = [
            ['@alice', '@alice'],
            ['@bob.smith', '@bob.smith'],
            ['@charlie-123', '@charlie-123'],
            ['@d.e-f', '@d.e-f'],
            ['@user.name', '@user.name'],
            ['@user-name', '@user-name'],
            ['@user.name-123', '@user.name-123'],
            ['@', null],
            ['@@double', '@double'],
            ['@with.dot.', '@with.dot.'],
            ['@with-dash-', '@with-dash-'],
            ['@with..dots', '@with..dots'],
            ['@with--dash', '@with--dash'],
        ] as const;
        cases.forEach(([input, expected]) => {
            const [matched] = input.match(BSKY_MENTION_REGEX) ?? [null];
            expect(matched).toBe(expected);
        });
    });
});

describe('LENS_MENTION_REGEX', () => {
    it('should match lens mention', () => {
        const cases = [
            ['@lens/alice', '@lens/alice'],
            ['@lens/bob123', '@lens/bob123'],
            ['@lens/abc_def', '@lens/abc_def'],
            ['@lens/abc-def', '@lens/abc-def'],
            ['@alice.lens', '@alice.lens'],
            ['@bob123.lens', '@bob123.lens'],
            ['@abc_def.lens', '@abc_def.lens'],
            ['@abc-def.lens', '@abc-def.lens'],
            ['on @fireflyapp', '@fireflyapp'],
            ['@fireflyapp.', '@fireflyapp'],
            ['@lens/', null],
            ['@.lens', null],
            ['@lens/alice.lens', '@lens/alice.lens'],
            ['@lens/alice.lens123', '@lens/alice.lens123'],
            ['@notlens/abc', null],
            ['@alice', '@alice'],
            ['@Lens', '@Lens'],
            ['@alice.xyz', null],
            ['alice.lens', null],
            ['@lens', '@lens'],
        ] as const;
        cases.forEach(([input, expected]) => {
            const [matched] = input.match(LENS_MENTION_REGEX) ?? [null];
            expect(matched).toBe(expected);
        });
    });
});

describe('FARCASTER_MENTION_REGEX', () => {
    it('should match farcaster mention - single level ENS', () => {
        const cases = [
            // Single level .eth domains
            ['@vitalik.eth', '@vitalik.eth'],
            ['@alice.eth', '@alice.eth'],
            ['@bob-123.eth', '@bob-123.eth'],
            ['@user_name.eth', '@user_name.eth'],
            ['@jesse.base.eth', '@jesse.base.eth'],
            ['@a.eth', '@a.eth'],
        ] as const;

        cases.forEach(([input, expected]) => {
            FARCASTER_MENTION_REGEX.lastIndex = 0;
            const [matched] = input.match(FARCASTER_MENTION_REGEX) ?? [null];
            expect(matched).toBe(expected);
        });
    });
});
