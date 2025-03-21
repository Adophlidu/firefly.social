import type { NetworkPluginID } from '@/constants/enum.js';
import type { Web3Helper } from '@masknet/web3-helpers';
import type { BaseHubProvider } from '../../Base/apis/HubBase.js';
import type { BaseHubFungible } from '../../Base/apis/HubFungible.js';
import type { BaseHubNonFungible } from '../../Base/apis/HubNonFungible.js';
import type { BaseHubOptions } from '../../Base/apis/HubOptions.js';

export interface HubOptions<T extends NetworkPluginID> extends BaseHubOptions<Web3Helper.Definition[T]['ChainId']> {}

export interface Hub<T extends NetworkPluginID>
    extends BaseHubProvider<Web3Helper.Definition[T]['ChainId']>,
        BaseHubFungible<Web3Helper.Definition[T]['ChainId']>,
        BaseHubNonFungible<Web3Helper.Definition[T]['ChainId'], Web3Helper.Definition[T]['SchemaType']> {}
