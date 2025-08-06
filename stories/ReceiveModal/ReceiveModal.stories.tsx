import type { Meta, StoryObj } from '@storybook/react';

import { ReceiveModal } from '@/components/ReceiveModal/index.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { NetworkPluginID } from '@/constants/enum.js';
import { getNetworkDescriptor } from '@/helpers/getNetworkDescriptor.js';

const meta = {
    title: 'FireflyWallet/ReceiveModal',
    component: ReceiveModal,
} satisfies Meta<typeof ReceiveModal>;

export default meta;

export const Default: StoryObj<typeof ReceiveModal> = {
    render(args) {
        return (
            <ReceiveModal
                open
                items={wagmiConfig.chains.map((x) => {
                    return {
                        avatar: getNetworkDescriptor(NetworkPluginID.PLUGIN_EVM, x.id)?.icon ?? '',
                        name: x.name,
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                    };
                })}
            />
        );
    },
};
