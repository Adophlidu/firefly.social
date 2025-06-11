import '../src/app/globals.css';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { InteractiveTippy } from '@/components/InteractiveTippy.jsx';

const meta = {
    title: 'common/InteractiveTippy',
    component: InteractiveTippy,
    decorators: [
        (Story) => (
            <div style={{ padding: '5em 10em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof InteractiveTippy>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        old: false,
        placement: 'top',
        trigger: 'mouseenter focus',
        interactive: true,
        delay: 300,
        disabled: false,
        visible: undefined,
        offset: [0, 10],
        content: 'Hover content',
        children: <span>Hover body</span>,
    },
    argTypes: {
        placement: {
            options: [
                'top',
                'bottom',
                'left',
                'right',
                'top-start',
                'top-end',
                'right-start',
                'right-end',
                'bottom-start',
                'bottom-end',
                'left-start',
                'left-end',
            ],
            control: { type: 'select' },
        },
        trigger: {
            options: ['mouseenter focus', 'click'],
            control: { type: 'select' },
        },
        visible: {
            options: [true, false, undefined],
            control: { type: 'select' },
        },
        appendTo: {
            options: ['parent', 'body', undefined],
            control: { type: 'select' },
            mapping: {
                parent: 'parent',
                body: document.body,
            },
        },
    },
};
export default meta;
