import { generateMnemonic } from 'bip39';

import { generateAccounts } from '../../../__tests__/helper';
import { MIN_ACC_CONTRACT_VERSION } from '../../../utils/constants';
import { Account } from '../account';
import { Cairo1Contract } from '../cairo1';
import { AccountContractReader } from '../reader';

export const upgradedContractVersion = `2.${MIN_ACC_CONTRACT_VERSION[1]}.0`;
export const upgradedContractVersionInHex = `322e332e30`;
export const nonUpgradedContractVersion = `0.0.0`;

export const mockAccountContractReader = ({
  balance = BigInt(1000000000000000000),
  version = upgradedContractVersion,
}) => {
  const getVersionSpy = jest.spyOn(
    AccountContractReader.prototype,
    'getVersion',
  );
  const getEthBalanceSpy = jest.spyOn(
    AccountContractReader.prototype,
    'getEthBalance',
  );

  getVersionSpy.mockResolvedValue(version);
  getEthBalanceSpy.mockResolvedValue(balance);

  return { getVersionSpy, getEthBalanceSpy };
};

export const createAccountContract = async (
  network,
  hdIndex = 0,
  ContractCtor = Cairo1Contract,
  mnemonicString = generateMnemonic(),
) => {
  const [account] = await generateAccounts(
    network.chainId,
    1,
    '1',
    hdIndex,
    mnemonicString,
  );

  const accountContractReader = new AccountContractReader(network);

  const contract = new ContractCtor(account.publicKey, accountContractReader);

  return {
    accountContractReader,
    contract,
    account,
  };
};

export const createAccountObject = async (network, hdIndex = 0) => {
  const { account, accountContractReader, contract } =
    await createAccountContract(network, hdIndex);

  const { privateKey, publicKey, chainId, addressIndex } = account;

  const accountObj = new Account({
    privateKey,
    publicKey,
    chainId,
    hdIndex: addressIndex,
    addressSalt: publicKey,
    accountContract: contract,
  });

  return {
    accountContractReader,
    contract,
    accountObj,
    account,
  };
};
