import '../src/app/globals.css';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TextOverflowTooltip } from '@/components/TextOverflowTooltip.jsx';

const meta = {
    title: 'common/TextOverflowTooltip',
    component: TextOverflowTooltip,
    decorators: [
        (Story) => (
            <div style={{ padding: '10em 20em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof TextOverflowTooltip>;

type Story = StoryObj<typeof meta>;
const long = (
    <div className="shrink grow basis-0 truncate text-center text-lg font-bold text-main">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nam nulla ut eveniet earum vitae magni pariatur. Nam
        magni natus neque? Minima at ducimus itaque beatae vel culpa, sed nobis aspernatur?
    </div>
);
export const Primary: Story = {
    args: {
        old: false,
        open: false,
        placement: 'top',
        content: 'A very long text that should overflow and show a tooltip when hovered over.',
        children: long,
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
        children: {
            control: { type: 'select' },
            options: ['overflow', 'no overflow'],
            mapping: {
                overflow: long,
                'no overflow': <div className="shrink grow basis-0 text-center text-lg font-bold text-main">Text</div>,
            },
        },
    },
};
export default meta;
