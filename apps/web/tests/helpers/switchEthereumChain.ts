import { switchEthereumChain } from '@dimensiondev/web3/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Connector } from 'wagmi';

const mockSwitchChain = vi.fn();
const mockConnectorSwitchChain = vi.fn();

vi.mock('wagmi/actions', () => ({
    switchChain: (...args: unknown[]) => mockSwitchChain(...args),
}));

vi.mock('@/configs/wagmiClient.js', () => ({
    wagmiConfig: {},
}));

const mockConfig = {} as Parameters<typeof switchEthereumChain>[0];

function makeConnector(options: { hasSwitchChain: boolean; currentChainId?: number }) {
    return {
        switchChain: options.hasSwitchChain ? mockConnectorSwitchChain : undefined,
        getChainId: vi.fn().mockResolvedValue(options.currentChainId ?? 1),
    } as unknown as Connector & { getChainId: ReturnType<typeof vi.fn> };
}

describe('switchEthereumChain', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when no connector is provided', () => {
        it('calls wagmi switchChain with the target chainId', async () => {
            await switchEthereumChain(mockConfig, 137);

            expect(mockSwitchChain).toHaveBeenCalledWith(mockConfig, expect.objectContaining({ chainId: 137 }));
        });

        it('includes addEthereumChainParameter for known chains', async () => {
            await switchEthereumChain(mockConfig, 1);

            expect(mockSwitchChain).toHaveBeenCalledWith(
                mockConfig,
                expect.objectContaining({ addEthereumChainParameter: expect.any(Object) }),
            );
        });

        it('passes addEthereumChainParameter as undefined for unknown chainId', async () => {
            await switchEthereumChain(mockConfig, 99999);

            expect(mockSwitchChain).toHaveBeenCalledWith(
                mockConfig,
                expect.objectContaining({ addEthereumChainParameter: undefined }),
            );
        });
    });

    describe('when connector has switchChain', () => {
        it('does nothing when already on target chain', async () => {
            const connector = makeConnector({ hasSwitchChain: true, currentChainId: 137 });

            await switchEthereumChain(mockConfig, 137, { connector });

            expect(mockConnectorSwitchChain).not.toHaveBeenCalled();
            expect(mockSwitchChain).not.toHaveBeenCalled();
        });

        it('calls connector.switchChain when on a different chain', async () => {
            const connector = makeConnector({ hasSwitchChain: true, currentChainId: 1 });

            await switchEthereumChain(mockConfig, 137, { connector });

            expect(mockConnectorSwitchChain).toHaveBeenCalledWith(expect.objectContaining({ chainId: 137 }));
            expect(mockSwitchChain).not.toHaveBeenCalled();
        });

        it('proceeds to connector.switchChain when getChainId rejects', async () => {
            const connector = makeConnector({ hasSwitchChain: true });
            connector.getChainId = vi.fn().mockRejectedValue(new Error('disconnected'));

            await switchEthereumChain(mockConfig, 137, { connector });

            expect(mockConnectorSwitchChain).toHaveBeenCalledWith(expect.objectContaining({ chainId: 137 }));
        });
    });

    describe('when connector lacks switchChain', () => {
        it('falls through to wagmi switchChain', async () => {
            const connector = makeConnector({ hasSwitchChain: false, currentChainId: 1 });

            await switchEthereumChain(mockConfig, 137, { connector });

            expect(mockSwitchChain).toHaveBeenCalledWith(mockConfig, expect.objectContaining({ chainId: 137 }));
        });
    });
});
