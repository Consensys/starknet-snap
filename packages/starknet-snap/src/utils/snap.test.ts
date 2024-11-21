import type { Component } from '@metamask/snaps-sdk';
import { heading, panel, text, divider, row } from '@metamask/snaps-sdk';

import * as snapUtil from './snap';

jest.mock('@metamask/key-tree', () => ({
  getBIP44AddressKeyDeriver: jest.fn(),
}));

describe('getBip44Deriver', () => {
  it('gets bip44 deriver', async () => {
    const spy = jest.spyOn(snapUtil.getProvider(), 'request');

    await snapUtil.getBip44Deriver();

    expect(spy).toHaveBeenCalledWith({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: 9004,
      },
    });
  });
});

describe('createInteractiveConfirmDialog', () => {
  it('calls snap_dialog', async () => {
    const spy = jest.spyOn(snapUtil.getProvider(), 'request');
    const interfaceId = 'test';

    await snapUtil.createInteractiveConfirmDialog(interfaceId);

    expect(spy).toHaveBeenCalledWith({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        id: interfaceId,
      },
    });
  });
});

describe('confirmDialog', () => {
  it('calls snap_dialog', async () => {
    const spy = jest.spyOn(snapUtil.getProvider(), 'request');
    const components: Component[] = [
      heading('header'),
      text('subHeader'),
      divider(),
      row('Label1', text('Value1')),
      text('**Label2**:'),
      row('SubLabel1', text('SubValue1')),
    ];

    await snapUtil.confirmDialog(components);

    expect(spy).toHaveBeenCalledWith({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel(components),
      },
    });
  });
});

describe('alertDialog', () => {
  it('calls snap_dialog', async () => {
    const spy = jest.spyOn(snapUtil.getProvider(), 'request');
    const components: Component[] = [
      heading('header'),
      text('subHeader'),
      divider(),
      row('Label1', text('Value1')),
      text('**Label2**:'),
      row('SubLabel1', text('SubValue1')),
    ];

    await snapUtil.alertDialog(components);

    expect(spy).toHaveBeenCalledWith({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content: panel(components),
      },
    });
  });
});

describe('getStateData', () => {
  it('gets state data', async () => {
    const spy = jest.spyOn(snapUtil.getProvider(), 'request');
    const testcase = {
      state: {
        transaction: [
          {
            txHash: 'hash',
            chainId: 'chainId',
          },
        ],
      },
    };

    spy.mockResolvedValue(testcase.state);
    const result = await snapUtil.getStateData();

    expect(spy).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: {
        operation: 'get',
      },
    });

    expect(result).toStrictEqual(testcase.state);
  });
});

describe('setStateData', () => {
  it('sets state data', async () => {
    const spy = jest.spyOn(snapUtil.getProvider(), 'request');
    const testcase = {
      state: {
        transaction: [
          {
            txHash: 'hash',
            chainId: 'chainId',
          },
        ],
      },
    };

    await snapUtil.setStateData(testcase.state);

    expect(spy).toHaveBeenCalledWith({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: testcase.state,
      },
    });
  });
});
