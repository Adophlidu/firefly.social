import { assert } from '@dimensiondev/utils';
import type { Address } from 'viem';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    lens,
    linea,
    mainnet,
    metis,
    optimism,
    polygon,
    scroll,
    xLayer,
    zkSync,
} from 'viem/chains';

const RED_PACKETS: Partial<Record<number, Address>> = {
    [mainnet.id]: '0xaBBe1101FD8fa5847c452A6D70C8655532B03C33',
    [bsc.id]: '0x0ca42C178e14c618c81B8438043F27d9D38145f6',
    [base.id]: '0x8D03d9b43e98Cc2f790Be4E96503fD0CcFd04a2D',
    [polygon.id]: '0x93e0b87A0aD0C991dc1B5176ddCD850c9a78aabb',
    [arbitrum.id]: '0x83D6b366f21e413f214EB077D5378478e71a5eD2',
    [gnosis.id]: '0x54a0A221C25Fc0a347EC929cFC5db0be17fA2a2B',
    [optimism.id]: '0x981be454a930479d92C91a0092D204b64845A5D6',
    [avalanche.id]: '0xF9F7C1496c21bC0180f4B64daBE0754ebFc8A8c0',
    [celo.id]: '0xAb7B1bE4233A04e5C43a810E75657ECED8E5463B',
    [fantom.id]: '0x578a7Fee5f0D8CEc7d00578Bf37374C5b95C4b98',
    [aurora.id]: '0x19f179D7e0D7d9F9d5386afFF64271D98A91615B',
    [confluxESpace.id]: '0x96c7d011cdfd467f551605f0f5fce279f86f4186',
    [scroll.id]: '0x16f61cb37169523635B6761f3C946892fb3c18fB',
    [metis.id]: '0x2cf91AD8C175305EBe6970Bd8f81231585EFbd77',
    [xLayer.id]: '0xDb847f1D8099C5b15519ECfd0b0C981d719bccE6',
    [lens.id]: '0x2CB304F176775Fcb4D9763f488c486B0Af9A6Bf8',
    [zkSync.id]: '0x5916FEE647A7f0aC234D6828Fe76636bd730B40A',
    [linea.id]: '0xB349AC5E5C037C2ecb2AE9fCDc8F122b5f384620',
};

export function getRedPacketContractAddress(chainId: number) {
    const address = RED_PACKETS[chainId];
    assert(address, `Red Packet contract not found for chain ID ${chainId}`);

    return address;
}
