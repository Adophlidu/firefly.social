import { describe, expect, it } from 'vitest';

import { parseParagraphHtml } from '@/helpers/parseParagraphHtml.js';

describe('parseParagraphHtml', () => {
    it('should return undefined when htmlString is empty', () => {
        const result = parseParagraphHtml('', '{"content": []}');
        expect(result).toBeUndefined();
    });

    it('should return undefined when jsonString is empty', () => {
        const result = parseParagraphHtml('<div>test</div>', '');
        expect(result).toBeUndefined();
    });

    it('should return undefined when both inputs are empty', () => {
        const result = parseParagraphHtml('', '');
        expect(result).toBeUndefined();
    });

    it('should handle invalid JSON gracefully', () => {
        const htmlString = '<div><img src="test.jpg" /></div>';
        const jsonString = 'invalid json';
        const result = parseParagraphHtml(htmlString, jsonString);
        expect(result).toBeUndefined();
    });
    it('should handle multiple root nodes', () => {
        const htmlString = 'multiple root nodes: <div>a node</div> with text node <div>and another one</div>';
        const jsonString = JSON.stringify({ content: [] });
        const result = parseParagraphHtml(htmlString, jsonString);
        expect(result).toMatchInlineSnapshot(
            `"multiple root nodes: <div>a node</div> with text node <div>and another one</div>"`,
        );
    });

    describe('Twitter embed functionality', () => {
        it('should replace Twitter image with video element', () => {
            const htmlString = '<div><img src="poster.jpg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster.jpg',
                                    variants: [{ type: 'video/mp4', src: 'video.mp4' }],
                                },
                            },
                        },
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toMatchInlineSnapshot(`"<div><video controls="true" src="video.mp4"></video></div>"`);
            expect(result).not.toContain('<img src="poster.jpg"');
        });

        it('should not replace image when poster does not match', () => {
            const htmlString = '<div><img src="different.jpg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster.jpg',
                                    variants: [{ type: 'video/mp4', src: 'video.mp4' }],
                                },
                            },
                        },
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toContain('<img src="different.jpg"');
            expect(result).not.toContain('<video');
        });

        it('should not replace image when video variant is not mp4', () => {
            const htmlString = '<div><img src="poster.jpg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster.jpg',
                                    variants: [{ type: 'video/webm', src: 'video.webm' }],
                                },
                            },
                        },
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toContain('<img src="poster.jpg"');
            expect(result).not.toContain('<video');
        });

        it('should handle missing tweetData gracefully', () => {
            const htmlString = '<div><img src="poster.jpg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {},
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toContain('<img src="poster.jpg"');
        });

        it('should handle missing video data gracefully', () => {
            const htmlString = '<div><img src="poster.jpg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {},
                        },
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toContain('<img src="poster.jpg"');
        });

        it('should handle multiple Twitter embeds', () => {
            const htmlString = '<div><img src="poster1.jpg" /><img src="poster2.jpg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster1.jpg',
                                    variants: [{ type: 'video/mp4', src: 'video1.mp4' }],
                                },
                            },
                        },
                    },
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster2.jpg',
                                    variants: [{ type: 'video/mp4', src: 'video2.mp4' }],
                                },
                            },
                        },
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toMatchInlineSnapshot(
                `"<div><video controls="true" src="video1.mp4"></video><video controls="true" src="video2.mp4"></video></div>"`,
            );
        });
    });

    describe('SVG embed functionality', () => {
        it('should update image dimensions for figure embeds', () => {
            const htmlString = '<div><img src="image.svg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'figure',
                        content: [
                            {
                                attrs: {
                                    src: 'image.svg',
                                    nextheight: 300,
                                    nextwidth: 400,
                                },
                            },
                        ],
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toContain('height="300px"');
            expect(result).toContain('width="400px"');
        });

        it('should not update dimensions when src does not match', () => {
            const htmlString = '<div><img src="different.svg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'figure',
                        content: [
                            {
                                attrs: {
                                    src: 'image.svg',
                                    nextheight: 300,
                                    nextwidth: 400,
                                },
                            },
                        ],
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).not.toContain('height="300px"');
            expect(result).not.toContain('width="400px"');
        });

        it('should not update dimensions when nextheight or nextwidth is missing', () => {
            const htmlString = '<div><img src="image.svg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'figure',
                        content: [
                            {
                                attrs: {
                                    src: 'image.svg',
                                },
                            },
                        ],
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).not.toContain('height=');
            expect(result).not.toContain('width=');
        });

        it('should handle multiple figure embeds', () => {
            const htmlString = '<div><img src="image1.svg" /><img src="image2.svg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'figure',
                        content: [
                            {
                                attrs: {
                                    src: 'image1.svg',
                                    nextheight: 100,
                                    nextwidth: 200,
                                },
                            },
                            {
                                attrs: {
                                    src: 'image2.svg',
                                    nextheight: 300,
                                    nextwidth: 400,
                                },
                            },
                        ],
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toContain('height="100px"');
            expect(result).toContain('width="200px"');
            expect(result).toContain('height="300px"');
            expect(result).toContain('width="400px"');
        });
    });

    describe('Complex scenarios', () => {
        it('should handle both Twitter and SVG embeds in same content', () => {
            const htmlString = '<div><img src="poster.jpg" /><img src="image.svg" /></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster.jpg',
                                    variants: [{ type: 'video/mp4', src: 'video.mp4' }],
                                },
                            },
                        },
                    },
                    {
                        type: 'figure',
                        content: [
                            {
                                attrs: {
                                    src: 'image.svg',
                                    nextheight: 300,
                                    nextwidth: 400,
                                },
                            },
                        ],
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toMatchInlineSnapshot(
                `"<div><video controls="true" src="video.mp4"></video><img width="400px" height="300px" src="image.svg"></div>"`,
            );
        });

        it('should preserve original HTML structure', () => {
            const htmlString = '<div class="container"><p>Text</p><img src="poster.jpg" /><span>More text</span></div>';
            const jsonString = JSON.stringify({
                content: [
                    {
                        type: 'twitter',
                        attrs: {
                            tweetData: {
                                video: {
                                    poster: 'poster.jpg',
                                    variants: [{ type: 'video/mp4', src: 'video.mp4' }],
                                },
                            },
                        },
                    },
                ],
            });

            const result = parseParagraphHtml(htmlString, jsonString);
            expect(result).toMatchInlineSnapshot(
                `"<div class="container"><p>Text</p><video controls="true" src="video.mp4"></video><span>More text</span></div>"`,
            );
        });
    });
});
