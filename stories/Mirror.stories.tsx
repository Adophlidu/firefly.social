import '../src/app/globals.css';

import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';

import { MirrorUI } from '@/components/Actions/Mirror.js';
import { Source } from '@/constants/enum.js';

const meta = {
    title: 'common/Action/Mirror',
    component: MirrorUI,
    decorators: [
        (Story) => (
            <div style={{ margin: '10em 20em' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MirrorUI>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        source: Source.Lens,
        postId: 'postId',
        canUndoMirror: true,
        disabled: false,
        handleMirror: action('handleMirror'),
        handleQuote: action('handleQuote'),
        hasQuoted: true,
        hasMirrored: false,
        mirrorDisabled: false,
        mirrorLoading: false,
        onClick: action('onClick'),
        quoteDisabled: false,
        shares: 1,
    },
};
export default meta;
