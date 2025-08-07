import type { Meta, StoryObj } from '@storybook/react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SnackbarProvider, useSnackbar } from '@/components/Snackbar.js';

const meta: Meta<typeof SnackbarProvider> = {
    title: 'Components/Snackbar',
    component: SnackbarProvider,
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <div className="h-screen w-full">
                <Story />
            </div>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

function SnackbarDemo() {
    const { enqueueSnackbar } = useSnackbar();

    const addSnackbar = (variant: 'default' | 'success' | 'error' | 'warning' | 'info') => {
        enqueueSnackbar(`This is a ${variant} message. Please read the message!`, { variant });
    };

    const addMultipleSnackbars = () => {
        addSnackbar('default');
        setTimeout(() => addSnackbar('success'), 200);
        setTimeout(() => addSnackbar('error'), 400);
    };

    return (
        <div className="flex flex-col gap-4 p-8">
            <h2 className="text-xl font-bold">Snackbar Animation Demo</h2>
            <div className="flex flex-wrap gap-2">
                <ClickableButton onClick={() => addSnackbar('default')}>Add Default</ClickableButton>
                <ClickableButton onClick={() => addSnackbar('success')}>Add Success</ClickableButton>
                <ClickableButton onClick={() => addSnackbar('error')}>Add Error</ClickableButton>
                <ClickableButton onClick={() => addSnackbar('warning')}>Add Warning</ClickableButton>
                <ClickableButton onClick={() => addSnackbar('info')}>Add Info</ClickableButton>
                <ClickableButton onClick={addMultipleSnackbars}>Add Multiple</ClickableButton>
            </div>
            <p className="text-sm text-gray-600">
                Try adding multiple snackbars and then close one of them to see the improved animation!
            </p>
        </div>
    );
}

export const Default: Story = {
    render: () => (
        <SnackbarProvider
            maxSnack={5}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            autoHideDuration={10000}
            classes={{}}
        >
            <SnackbarDemo />
        </SnackbarProvider>
    ),
};

export const WithAutoHide: Story = {
    render: () => (
        <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            autoHideDuration={3000}
            classes={{}}
        >
            <SnackbarDemo />
        </SnackbarProvider>
    ),
};
