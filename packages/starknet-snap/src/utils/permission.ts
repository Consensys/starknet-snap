import { UnauthorizedError } from '@metamask/snaps-sdk';

export enum RpcMethod {
  GetPreferences = 'starkNet_getPreferences',
  ExtractPublicKey = 'starkNet_extractPublicKey',
  GetCurrentNetwork = 'starkNet_getCurrentNetwork',
  GetStoredNetworks = 'starkNet_getStoredNetworks',
  SwitchNetwork = 'starkNet_switchNetwork',
  AddErc20Token = 'starkNet_addErc20Token',
  RecoverAccounts = 'starkNet_recoverAccounts',
  ExecuteTxn = 'starkNet_executeTxn',
  DeclareContract = 'starkNet_declareContract',
  GetDeploymentData = 'starkNet_getDeploymentData',
  SignMessage = 'starkNet_signMessage',
  SignTransaction = 'starkNet_signTransaction',
  SignDeclareTransaction = 'starkNet_signDeclareTransaction',
  SignDeployAccountTransaction = 'starkNet_signDeployAccountTransaction',
  GetCurrentAccount = 'starkNet_getCurrentAccount',
  ListAccounts = 'starkNet_listAccounts',

  SetAccountName = 'starkNet_setAccountName',
  SwitchAccount = 'starkNet_switchAccount',
  AddAccount = 'starkNet_addAccount',
  CreateAccount = 'starkNet_createAccount',
  DisplayPrivateKey = 'starkNet_displayPrivateKey',
  GetErc20TokenBalance = 'starkNet_getErc20TokenBalance',
  GetTransactionStatus = 'starkNet_getTransactionStatus',
  EstimateFee = 'starkNet_estimateFee',
  VerifySignedMessage = 'starkNet_verifySignedMessage',
  DeployCario0Account = 'starkNet_createAccountLegacy',
  GetTransactions = 'starkNet_getTransactions',
  UpgradeAccContract = 'starkNet_upgradeAccContract',
  GetStarkName = 'starkNet_getStarkName',
  GetAddressByStarkName = 'starkNet_getAddrFromStarkName',
  ReadContract = 'starkNet_getValue',
  GetStoredErc20Tokens = 'starkNet_getStoredErc20Tokens',
  Ping = 'ping',
}
// RpcMethod that are allowed to be called by any origin
const publicPermissions = [
  RpcMethod.ExtractPublicKey,
  RpcMethod.ListAccounts,
  RpcMethod.GetCurrentNetwork,
  RpcMethod.GetStoredNetworks,
  RpcMethod.SwitchNetwork,
  RpcMethod.AddErc20Token,
  RpcMethod.RecoverAccounts,
  RpcMethod.ExecuteTxn,
  RpcMethod.DeclareContract,
  RpcMethod.GetDeploymentData,
  RpcMethod.SignMessage,
  RpcMethod.SignTransaction,
  RpcMethod.SignDeclareTransaction,
  RpcMethod.SignDeployAccountTransaction,
  RpcMethod.CreateAccount,
  RpcMethod.GetCurrentAccount,
  RpcMethod.DisplayPrivateKey,
  RpcMethod.GetErc20TokenBalance,
  RpcMethod.GetTransactionStatus,
  RpcMethod.EstimateFee,
  RpcMethod.VerifySignedMessage,
  RpcMethod.Ping,
];
// RpcMethod that are restricted to be called by wallet UI origins
const walletUIDappPermissions = publicPermissions.concat([
  RpcMethod.GetPreferences,
  RpcMethod.DeployCario0Account,
  RpcMethod.GetTransactions,
  RpcMethod.UpgradeAccContract,
  RpcMethod.GetStarkName,
  RpcMethod.GetAddressByStarkName,
  RpcMethod.ReadContract,
  RpcMethod.GetStoredErc20Tokens,
  RpcMethod.AddAccount,
  RpcMethod.SwitchAccount,
  RpcMethod.SetAccountName,
]);

const publicPermissionsSet = new Set(publicPermissions);
const walletUIDappPermissionsSet = new Set(walletUIDappPermissions);

const walletUIDappOrigins = [
  'http://localhost:3000',
  'https://snaps.consensys.io',
  'https://dev.snaps.consensys.io',
  'https://staging.snaps.consensys.io',
];

export const originPermissions = new Map<string, Set<string>>([]);
for (const origin of walletUIDappOrigins) {
  originPermissions.set(origin, walletUIDappPermissionsSet);
}
originPermissions.set('*', publicPermissionsSet);

/**
 * Validate the origin and method pair.
 * If the origin is not found or the method is not allowed, throw an error.
 *
 * @param origin - The origin of the request.
 * @param method - The method of the request.
 * @throws {UnauthorizedError} If the origin is not found or the method is not allowed.
 */
export function validateOrigin(origin: string, method: string): void {
  if (!origin) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new UnauthorizedError('Origin not found');
  }
  // As public permissions are a subset of wallet UI Dapp permissions,
  // If the origin and method pair are not in the wallet UI Dapp permissions,
  // then fallback and validate whether it hits the common permission.
  if (
    !originPermissions.get(origin)?.has(method) &&
    !originPermissions.get('*')?.has(method)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw new UnauthorizedError(`Permission denied`);
  }
}
