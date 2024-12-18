import {
  constants,
  TransactionFinalityStatus,
  TransactionType,
} from 'starknet';

import callsExamples from '../__tests__/fixture/callsExamples.json';
import { generateAccounts } from '../__tests__/helper';
import { FeeToken } from '../types/snapApi';
import { ContractFuncName, TransactionDataVersion } from '../types/snapState';
import {
  ETHER_SEPOLIA_TESTNET,
  STRK_SEPOLIA_TESTNET,
  TRANSFER_SELECTOR_HEX,
  UPGRADE_SELECTOR_HEX,
} from './constants';
import {
  callsToTranscationAccountCalls,
  newDeployTransaction,
  newInvokeTransaction,
  transactionVersionToNumber,
  feeTokenToTransactionVersion,
  transactionVersionToFeeToken,
  transactionSelectorToName,
  isFundTransferEntrypoint,
} from './transaction';

describe('transactionVersionToNumber', () => {
  it.each([
    constants.TRANSACTION_VERSION.V3,
    constants.TRANSACTION_VERSION.F3,
    3,
    '3',
  ])(
    'converts the transaction version to 3 if the given txnVersion is %s',
    (txnVersion: string) => {
      expect(transactionVersionToNumber(txnVersion)).toBe(3);
    },
  );

  it.each([
    ...Object.values(constants.TRANSACTION_VERSION).filter(
      (ver) =>
        ver !== constants.TRANSACTION_VERSION.V3 &&
        ver !== constants.TRANSACTION_VERSION.F3,
    ),
    '1',
    1,
    'invalid_version',
  ])(
    'converts the transaction version to 1 if the given txnVersion is %s',
    (txnVersion: string) => {
      expect(transactionVersionToNumber(txnVersion)).toBe(1);
    },
  );
});

describe('feeTokenToTransactionVersion', () => {
  it('converts feeToken string to transaction version v3 if it is STRK', () => {
    expect(feeTokenToTransactionVersion(FeeToken.STRK)).toStrictEqual(
      constants.TRANSACTION_VERSION.V3,
    );
  });

  it.each([FeeToken.ETH, 'invalid_unit'])(
    'converts feeToken string to transaction version v1 if it is not STRK - %s',
    (txnVersion: string) => {
      expect(feeTokenToTransactionVersion(txnVersion)).toStrictEqual(
        constants.TRANSACTION_VERSION.V1,
      );
    },
  );
});

describe('transactionVersionToFeeToken', () => {
  it('converts transaction version to STRK unit if it is transaction v3', () => {
    expect(
      transactionVersionToFeeToken(constants.TRANSACTION_VERSION.V3),
    ).toStrictEqual(FeeToken.STRK);
  });

  it.each([
    Object.values(constants.TRANSACTION_VERSION).filter(
      (ver) => ver !== constants.TRANSACTION_VERSION.V3,
    ),
    'invalid_unit',
  ])(
    'converts transaction version to ETH unit if it is not STRK - %s',
    (txnVersion: string) => {
      expect(transactionVersionToFeeToken(txnVersion)).toStrictEqual(
        FeeToken.ETH,
      );
    },
  );
});

describe('transactionSelectorToName', () => {
  it.each([TRANSFER_SELECTOR_HEX, 'transfer'])(
    'converts selector name to `transfer` if it matchs the transfer selector - %s',
    (selector: string) => {
      expect(transactionSelectorToName(selector)).toStrictEqual(
        ContractFuncName.Transfer,
      );
    },
  );

  it.each([UPGRADE_SELECTOR_HEX, 'upgrade'])(
    'converts selector name to `upgrade` if it matchs the upgrade selector - %s',
    (selector: string) => {
      expect(transactionSelectorToName(selector)).toStrictEqual(
        ContractFuncName.Upgrade,
      );
    },
  );

  it.each(['transfers', 'upgraded', '0x11234'])(
    'returns the original selector string if it doesnt match the hex string for upgrade or transfer',
    (selector: string) => {
      expect(transactionSelectorToName(selector)).toStrictEqual(selector);
    },
  );
});

describe('callsToTranscationAccountCalls', () => {
  it('converts calls to transaction account calls', () => {
    const { calls } = callsExamples.singleCall;
    const result = callsToTranscationAccountCalls([calls]);

    const {
      contractAddress: contract,
      calldata: contractCallData,
      entrypoint,
    } = calls;

    expect(result).toStrictEqual({
      [contract]: [
        {
          contract,
          contractCallData,
          contractFuncName: transactionSelectorToName(entrypoint),
        },
      ],
    });
  });

  it('converts calls to transaction account calls with recipient and amount if it is an fund transfer call', async () => {
    const [{ address }] = await generateAccounts(
      constants.StarknetChainId.SN_SEPOLIA,
      1,
    );
    const amount = '100000000000';
    const calls = [
      {
        contractAddress: ETHER_SEPOLIA_TESTNET.address,
        calldata: [address, amount],
        entrypoint: TRANSFER_SELECTOR_HEX,
      },
      {
        contractAddress: ETHER_SEPOLIA_TESTNET.address,
        calldata: [address, amount],
        entrypoint: TRANSFER_SELECTOR_HEX,
      },
      {
        contractAddress: STRK_SEPOLIA_TESTNET.address,
        calldata: [address, amount],
        entrypoint: TRANSFER_SELECTOR_HEX,
      },
    ];

    const result = callsToTranscationAccountCalls(calls);

    expect(result).toStrictEqual(
      calls.reduce((acc, call) => {
        const {
          contractAddress: contract,
          calldata: contractCallData,
          entrypoint,
        } = call;

        if (!Object.prototype.hasOwnProperty.call(acc, contract)) {
          acc[contract] = [];
        }
        acc[contract].push({
          contract,
          contractCallData,
          contractFuncName: transactionSelectorToName(entrypoint),
          recipient: contractCallData[0],
          amount: contractCallData[1],
        });
        return acc;
      }, {}),
    );
  });
});

describe('isFundTransferEntrypoint', () => {
  it.each([TRANSFER_SELECTOR_HEX, 'transfer'])(
    'returns true if the entrypoint is a fund transfer entrypoint - %s',
    (entrypoint: string) => {
      expect(isFundTransferEntrypoint(entrypoint)).toBe(true);
    },
  );

  it('returns false if the entrypoint is not a fund transfer entrypoint', () => {
    expect(isFundTransferEntrypoint(UPGRADE_SELECTOR_HEX)).toBe(false);
  });
});

describe('newInvokeTransaction', () => {
  it('creates a new invoke transaction', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const [{ address: senderAddress }] = await generateAccounts(chainId, 1);
    const { hash: txnHash, calls } = callsExamples.multipleCalls;
    const txnVersion = 1;
    const maxFee = '10';

    const result = newInvokeTransaction({
      txnHash,
      senderAddress,
      chainId,
      maxFee,
      calls,
      txnVersion,
    });

    expect(result).toStrictEqual({
      txnHash,
      txnType: TransactionType.INVOKE,
      chainId,
      senderAddress,
      contractAddress: '',
      finalityStatus: TransactionFinalityStatus.RECEIVED,
      executionStatus: TransactionFinalityStatus.RECEIVED,
      failureReason: '',
      timestamp: expect.any(Number),
      dataVersion: TransactionDataVersion.V2,
      version: txnVersion,
      maxFee,
      actualFee: null,
      accountCalls: callsToTranscationAccountCalls(calls),
    });
  });

  it('convert a 62 transaction hash to 66 transaction hash', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const [{ address: senderAddress }] = await generateAccounts(chainId, 1);
    const { calls } = callsExamples.multipleCalls;
    const txnVersion = 1;
    const maxFee = '10';

    const result = newInvokeTransaction({
      // 62 transaction hash
      txnHash:
        '0xb28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
      senderAddress,
      chainId,
      maxFee,
      calls,
      txnVersion,
    });

    expect(result).toStrictEqual({
      // 64 transaction hash
      txnHash:
        '0x00b28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
      txnType: TransactionType.INVOKE,
      chainId,
      senderAddress,
      contractAddress: '',
      finalityStatus: TransactionFinalityStatus.RECEIVED,
      executionStatus: TransactionFinalityStatus.RECEIVED,
      failureReason: '',
      timestamp: expect.any(Number),
      dataVersion: TransactionDataVersion.V2,
      version: txnVersion,
      maxFee,
      actualFee: null,
      accountCalls: callsToTranscationAccountCalls(calls),
    });
  });
});

describe('newDeployTransaction', () => {
  it('creates a new deploy transaction', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const [{ address: senderAddress }] = await generateAccounts(chainId, 1);
    const { hash: txnHash } = callsExamples.multipleCalls;
    const txnVersion = 1;

    const result = newDeployTransaction({
      txnHash,
      senderAddress,
      chainId,
      txnVersion,
    });

    expect(result).toStrictEqual({
      txnHash,
      txnType: TransactionType.DEPLOY_ACCOUNT,
      chainId,
      senderAddress,
      contractAddress: senderAddress,
      finalityStatus: TransactionFinalityStatus.RECEIVED,
      executionStatus: TransactionFinalityStatus.RECEIVED,
      failureReason: '',
      timestamp: expect.any(Number),
      dataVersion: TransactionDataVersion.V2,
      version: txnVersion,
      maxFee: null,
      actualFee: null,
      accountCalls: null,
    });
  });

  it('convert a 62 transaction hash to 66 transaction hash', async () => {
    const chainId = constants.StarknetChainId.SN_SEPOLIA;
    const [{ address: senderAddress }] = await generateAccounts(chainId, 1);
    const txnVersion = 1;

    const result = newDeployTransaction({
      // 62 transaction hash
      txnHash:
        '0xb28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
      senderAddress,
      chainId,
      txnVersion,
    });

    expect(result).toStrictEqual({
      // 64 transaction hash
      txnHash:
        '0x00b28a089e7fb83debee4607b6334d687918644796b47d9e9e38ea8213833137',
      txnType: TransactionType.DEPLOY_ACCOUNT,
      chainId,
      senderAddress,
      contractAddress: senderAddress,
      finalityStatus: TransactionFinalityStatus.RECEIVED,
      executionStatus: TransactionFinalityStatus.RECEIVED,
      failureReason: '',
      timestamp: expect.any(Number),
      dataVersion: TransactionDataVersion.V2,
      version: txnVersion,
      maxFee: null,
      actualFee: null,
      accountCalls: null,
    });
  });
});
