// user-input.test.tsx

import type { InterfaceContext, UserInputEvent } from '@metamask/snaps-sdk';
import { Box, Heading, Spinner } from '@metamask/snaps-sdk/jsx';
import { constants } from 'starknet';

import { generateAccounts } from '../__tests__/helper';
import { NetworkStateManager } from '../state/network-state-manager';
import type { SnapState } from '../types/snapState';
import * as uiUtils from '../ui/utils';
import { logger } from './logger';
import * as snapHelper from './snap';
import * as starknetUtils from './starknetUtils';
import { AccountUserInputController, UserInputController } from './user-input';

jest.mock('./snap');
jest.mock('./logger');
jest.mock('../ui/utils');
jest.mock('../state/network-state-manager');

describe('UserInputController', () => {
  class MockUserInputController extends UserInputController {
    // Make handleUserInput public for testing purposes
    async handleUserInput(
      _id: string,
      _event: UserInputEvent,
      _context: InterfaceContext | null,
    ): Promise<void> {
      // Simulate some action
    }
  }

  it('executes user input handling', async () => {
    const controller = new MockUserInputController('Processing...');

    const handleUserInputSpy = jest.spyOn(controller, 'handleUserInput');

    const id = 'test-id';
    const event = { name: 'test-event', value: 'test-value' } as UserInputEvent;
    const context = { data: 'test-context' } as InterfaceContext;

    await controller.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
  });

  it('logs information and updates interface during preExecute', async () => {
    const controller = new MockUserInputController('Loading something...');
    const loggerInfoSpy = jest.spyOn(logger, 'info');
    const updateInterfaceSpy = jest.spyOn(uiUtils, 'updateInterface');

    const id = 'test-id';
    const event = { name: 'test-event', value: 'test-value' } as UserInputEvent;
    const context = { data: 'test-context' } as InterfaceContext;

    await controller.execute(id, event, context);

    expect(loggerInfoSpy).toHaveBeenCalledWith(
      `User Input ${id}, ${JSON.stringify(event)} Params: ${JSON.stringify(
        context,
      )}`,
    );
    expect(updateInterfaceSpy).toHaveBeenCalledWith(
      id,
      <Box alignment="space-between" center={true}>
        <Heading>Loading something...</Heading>
        <Spinner />
      </Box>,
    );
  });
});

describe('AccountUserInputController', () => {
  class MockAccountUserInputController extends AccountUserInputController {
    async getSigner(
      _id: string,
      _event: UserInputEvent,
      context: InterfaceContext | null,
    ): Promise<string> {
      const signer = context?.signer as string;
      return Promise.resolve(signer);
    }

    async handleUserInput(
      _id: string,
      _event: UserInputEvent,
      context: InterfaceContext | null,
    ): Promise<void> {
      const signer = context?.signer as string;
      await this.setupAccount(signer);
      // Simulate additional actions
    }
  }

  const mockAccount = async (network: constants.StarknetChainId) => {
    const accounts = await generateAccounts(network, 1);
    return accounts[0];
  };

  const prepareSetupAccount = async (account: any) => {
    const getCurrentNetworkSpy = jest
      .spyOn(NetworkStateManager.prototype, 'getCurrentNetwork')
      .mockResolvedValue(account.network);

    const getBip44DeriverSpy = jest.spyOn(snapHelper, 'getBip44Deriver');
    const getStateDataSpy = jest.spyOn(snapHelper, 'getStateData');
    const getKeysFromAddressSpy = jest.spyOn(
      starknetUtils,
      'getKeysFromAddress',
    );

    const state: SnapState = {
      accContracts: [],
      erc20Tokens: [],
      networks: [],
      transactions: [],
    };
    getStateDataSpy.mockResolvedValue(state);

    getKeysFromAddressSpy.mockResolvedValue({
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      addressIndex: account.addressIndex,
      derivationPath: account.derivationPath,
    });

    return {
      getCurrentNetworkSpy,
      getBip44DeriverSpy,
      getStateDataSpy,
      getKeysFromAddressSpy,
    };
  };

  it('executes user input and sets up account during handling', async () => {
    const controller = new MockAccountUserInputController();

    const handleUserInputSpy = jest.spyOn(controller, 'handleUserInput');

    const setupAccountSpy = jest.spyOn(controller as any, 'setupAccount');
    const networkChainId = constants.StarknetChainId.SN_SEPOLIA;
    const account = await mockAccount(networkChainId);

    await prepareSetupAccount(account);

    const id = 'test-id';
    const signer = account.address;
    const event = { name: 'test-event', value: 'test-value' } as UserInputEvent;
    const context = { signer: account.address };

    await controller.execute(id, event, context);

    expect(handleUserInputSpy).toHaveBeenCalledWith(id, event, context);
    expect(setupAccountSpy).toHaveBeenCalledWith(signer);
  });
});
