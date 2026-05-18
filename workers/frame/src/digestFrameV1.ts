import { FrameProtocol } from '@dimensiondev/enums';
import { digestImageUrl } from '@dimensiondev/workers-sizeof/digestImageUrl.js';
import type { Context } from 'hono';

import type { FrameInput, FrameV1 } from '@/frame/src/types.js';
import { ActionType } from '@/frame/src/types.js';

interface FrameMetadata {
    title?: string;
    imageUrl?: string;
    imageAlt?: string;
    postUrl?: string;
    input?: FrameInput;
    buttons: Array<{
        index: 1 | 2 | 3 | 4;
        text: string;
        action: ActionType;
        target?: string;
        postUrl?: string;
    }>;
    refreshPeriod?: number;
    aspectRatio?: '1.91:1' | '1:1';
    state?: string;
    protocol?: FrameProtocol;
    version?: string;
}

async function parseFrameMetadata(html: string): Promise<FrameMetadata> {
    const metadata: FrameMetadata = {
        buttons: [],
    };

    const rewriter = new HTMLRewriter()
        .on('meta', {
            element(element) {
                const name = element.getAttribute('name');
                const property = element.getAttribute('property');

                const content = element.getAttribute('content');
                if (!content) return;

                const key = name || property;
                if (!key) return;

                // Title extraction
                if (key === 'og:title' || key === 'fc:frame:title' || key === 'of:title') {
                    metadata.title = content;
                }

                // Image extraction
                if (key === 'og:image' || key === 'fc:frame:image' || key === 'of:image') {
                    metadata.imageUrl = content;
                }

                // Image alt extraction
                if (key === 'fc:frame:image:alt' || key === 'of:image:alt') {
                    metadata.imageAlt = content;
                }

                // Post URL extraction
                if (key === 'fc:frame:post_url' || key === 'of:post_url') {
                    metadata.postUrl = content;
                }

                // Input extraction
                if (key === 'fc:frame:input:text' || key === 'of:input:text') {
                    metadata.input = { label: content };
                }

                // Refresh period extraction
                if (key === 'fc:frame:refresh_period' || key === 'of:refresh_period') {
                    const period = Number.parseInt(content, 10);
                    if (!Number.isNaN(period) && period >= 0) {
                        metadata.refreshPeriod = period;
                    }
                }

                // Aspect ratio extraction
                if (
                    key === 'fc:frame:aspect_ratio' ||
                    key === 'of:aspect_ratio' ||
                    key === 'fc:frame:image:aspect_ratio' ||
                    key === 'of:image:aspect_ratio'
                ) {
                    metadata.aspectRatio = content === '1:1' ? '1:1' : '1.91:1';
                }

                // State extraction
                if (key === 'fc:frame:state' || key === 'of:state') {
                    metadata.state = content;
                }

                // Protocol detection
                if (key === 'of:version') {
                    metadata.protocol = FrameProtocol.OpenFrame;
                    metadata.version = content;
                }
                if (key === 'fc:frame') {
                    metadata.protocol = FrameProtocol.Farcaster;
                    metadata.version = content;
                }

                // Button extraction
                if (key.startsWith('fc:frame:button:') || key.startsWith('of:button:')) {
                    const [, , , buttonIndex, buttonType = 'text'] = key.split(':');

                    if (buttonType === 'text') {
                        const index = Number.parseInt(buttonIndex, 10) as 1 | 2 | 3 | 4;
                        if (!Number.isNaN(index) && index >= 1 && index <= 4) {
                            // Find or create button
                            let button = metadata.buttons.find((b) => b.index === index);
                            if (!button) {
                                button = { index, text: content, action: ActionType.Post };
                                metadata.buttons.push(button);
                            } else {
                                button.text = content;
                            }
                        }
                    } else if (buttonType === 'action') {
                        const index = Number.parseInt(buttonIndex, 10) as 1 | 2 | 3 | 4;
                        if (!Number.isNaN(index) && index >= 1 && index <= 4) {
                            let button = metadata.buttons.find((b) => b.index === index);
                            if (!button) {
                                button = { index, text: '', action: ActionType.Post };
                                metadata.buttons.push(button);
                            } else {
                                // Map action string to ActionType enum
                                const actionMap: Record<string, ActionType> = {
                                    post: ActionType.Post,
                                    post_redirect: ActionType.PostRedirect,
                                    link: ActionType.Link,
                                    mint: ActionType.Mint,
                                    tx: ActionType.Transaction,
                                };
                                button.action = actionMap[content] || ActionType.Post;
                            }
                        }
                    } else if (buttonType === 'target') {
                        const index = Number.parseInt(buttonIndex, 10) as 1 | 2 | 3 | 4;
                        if (!Number.isNaN(index) && index >= 1 && index <= 4) {
                            let button = metadata.buttons.find((b) => b.index === index);
                            if (!button) {
                                button = { index, text: '', action: ActionType.Post, target: content };
                                metadata.buttons.push(button);
                            } else {
                                button.target = content;
                            }
                        }
                    } else if (key.includes('post_url')) {
                        const index = Number.parseInt(buttonIndex, 10) as 1 | 2 | 3 | 4;
                        if (!Number.isNaN(index) && index >= 1 && index <= 4) {
                            let button = metadata.buttons.find((b) => b.index === index);
                            if (!button) {
                                button = { index, text: '', action: ActionType.Post, postUrl: content };
                                metadata.buttons.push(button);
                            } else {
                                button.postUrl = content;
                            }
                        }
                    }
                }
            },
        })
        .on('title', {
            text(text) {
                if (!metadata.title) {
                    metadata.title = text.text;
                }
            },
        });

    // Process the HTML
    const response = rewriter.transform(new Response(html));
    await response.text();

    // Sort buttons by index
    metadata.buttons.sort((a, b) => a.index - b.index);

    return metadata;
}

export async function digestFrameV1(url: string, html: string, c: Context): Promise<FrameV1 | null> {
    const metadata = await parseFrameMetadata(html);

    const imageUrl = metadata.imageUrl;
    const imageAlt = metadata.imageAlt;
    const digestedImage = imageUrl ? await digestImageUrl(imageUrl, c) : null;
    if (!digestedImage) console.error(`[frame] image not found: imageUrl = ${imageUrl}`);

    const image = digestedImage ?? {
        width: 860,
        height: 640,
    };

    const frame: FrameV1 = {
        x_version: 1,
        url,
        title: metadata.title ?? 'Untitled Frame',
        version: 'vNext',
        image: {
            url: imageUrl ?? '/image/frame-fallback.png',
            alt: imageAlt ? imageAlt : undefined,
            width: image.width,
            height: image.height,
        },
        postUrl: url,
        input: null,
        buttons: [],
        // never refresh by default
        refreshPeriod: Number.MAX_SAFE_INTEGER,
        protocol: metadata.protocol || FrameProtocol.Farcaster,
    };

    if (metadata.postUrl) frame.postUrl = metadata.postUrl;
    if (metadata.input) frame.input = metadata.input;
    if (metadata.buttons.length) frame.buttons = metadata.buttons;
    if (metadata.refreshPeriod) frame.refreshPeriod = metadata.refreshPeriod;
    if (metadata.aspectRatio) frame.aspectRatio = metadata.aspectRatio;
    if (metadata.state) frame.state = metadata.state;

    return frame;
}
