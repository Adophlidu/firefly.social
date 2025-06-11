import '../src/app/globals.css';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Tooltip } from '@/components/Tooltip.jsx';

const meta = {
    title: 'common/Tooltip',
    component: Tooltip,
    decorators: [
        (Story) => (
            <div style={{ padding: '10em 20em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof Tooltip>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        old: false,
        touch: true,
        open: false,
        placement: 'top',
        interactive: true,
        hideOnClick: true,
        disabled: false,
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
    },
};
export default meta;
