/// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { MessageText } from '@/components/DirectMessages/MessageText.js';

vi.mock('@/components/Markup/MarkupLink/ExternalLink.js', async () => {
    const { createElement } = await import('react');

    return {
        ExternalLink: ({
            title,
            className,
            showExternalIcon,
        }: {
            title: string;
            className?: string;
            showExternalIcon?: boolean;
        }) =>
            createElement(
                'a',
                {
                    'data-external-link': true,
                    'data-show-external-icon': showExternalIcon,
                    className,
                    href: title.startsWith('http') ? title : `https://${title}`,
                },
                title,
            ),
    };
});

afterEach(cleanup);

describe('MessageText', () => {
    test('renders bare domains and full URLs with ExternalLink', () => {
        render(createElement(MessageText, { content: 'Visit baidu.com or https://firefly.social' }));

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute('href')).toBe('https://baidu.com');
        expect(links[1].getAttribute('href')).toBe('https://firefly.social');
        expect(links.every((link) => link.dataset.externalLink === 'true')).toBe(true);
    });

    test('keeps non-link text unchanged', () => {
        render(createElement(MessageText, { content: 'hello world' }));

        expect(screen.getByText('hello world')).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();
    });

    test('does not linkify the domain portion of an email address', () => {
        render(createElement(MessageText, { content: 'hello@example.com' }));

        expect(screen.getByText('hello@example.com')).toBeTruthy();
        expect(screen.queryByRole('link')).toBeNull();
    });

    test('uses high-contrast typography and an icon in self-authored message bubbles', () => {
        render(createElement(MessageText, { content: 'firefly.social', isSelf: true }));

        const link = screen.getByRole('link');
        expect(link.classList.contains('!text-white')).toBe(true);
        expect(link.classList.contains('font-semibold')).toBe(true);
        expect(link.classList.contains('decoration-2')).toBe(true);
        expect(link.classList.contains('underline-offset-2')).toBe(true);
        expect(link.dataset.showExternalIcon).toBe('true');
    });
});
