import { BIP44AddressKeyDeriver, getBIP44AddressKeyDeriver } from '@metamask/key-tree';
import { DialogResult, Json, heading, panel, text, divider } from '@metamask/snaps-sdk';

export class SnapHelper {
  static wallet = snap;

  static async getBip44Deriver(coinType: number): Promise<BIP44AddressKeyDeriver> {
    const bip44Node = await SnapHelper.wallet.request({
      method: 'snap_getBip44Entropy',
      params: {
        coinType: coinType,
      },
    });
    return getBIP44AddressKeyDeriver(bip44Node);
  }

  static async ConfirmDialog(header: string, subHeader: string, content: Json): Promise<DialogResult> {
    return SnapHelper.wallet.request({
      method: 'snap_dialog',
      params: {
        type: 'confirmation',
        content: panel([
          heading(header),
          text(subHeader),
          divider(),
          ...Object.entries(content).map(([key, value]) => text(`**${key}**:\n ${value}`)),
        ]),
      },
    });
  }

  static async GetStateData<T>(): Promise<T> {
    return (await SnapHelper.wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'get',
      },
    })) as unknown as T;
  }

  static async SetStateData<T>(data: T) {
    await SnapHelper.wallet.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: data as Record<string, Json>,
      },
    });
  }
}
