/**
 * The wagmi connector id of the Privy embedded wallet. Lives in constants (not
 * in `connectors/PrivyConnector.ts`) so modules that only need the id (swap
 * buttons, wallet lists, red packet claims) do not pull the whole connector —
 * and its wagmi/session dependencies — into their chunk.
 */
export const PRIVY_CONNECTOR_ID = 'network.privy';
