import type { EstimateFee } from 'starknet';
import { num as numUtils } from 'starknet';

import type {
  ResourceBounds,
  ResourceBoundsInBigInt,
} from '../types/snapState';

export type ConsolidatedFees = {
  overallFee: bigint;
  suggestedMaxFee: bigint;
  resourceBounds: ResourceBoundsInBigInt;
};

export type SerializatedConsolidatedFees = {
  overallFee: string;
  suggestedMaxFee: string;
  resourceBounds: ResourceBounds;
};

/* eslint-disable @typescript-eslint/naming-convention */
export class ConsolidateFees {
  fees: EstimateFee[];

  overallFee: bigint;

  suggestedMaxFee: bigint;

  resourceBounds: ResourceBoundsInBigInt;

  constructor(fees: EstimateFee[]) {
    this.fees = fees;
    const { overallFee, suggestedMaxFee, resourceBounds } =
      this.consolidateFee();
    this.overallFee = overallFee;
    this.suggestedMaxFee = suggestedMaxFee;
    this.resourceBounds = resourceBounds;
  }

  /**
   * Consolidate the fees.
   *
   * @returns The consolidated fees.
   */
  protected consolidateFee(): ConsolidatedFees {
    const consolidateResult = this.fees.reduce<{
      overallFee: bigint;
      suggestedMaxFee: bigint;
      resourceBounds: {
        l1_gas: { max_amount: bigint; max_price_per_unit: bigint };
        l2_gas: { max_amount: bigint; max_price_per_unit: bigint };
        l1_data_gas?: { max_amount: bigint; max_price_per_unit: bigint };
      };
    }>(
      (acc, fee) => {
        acc.overallFee += fee.overall_fee;
        acc.suggestedMaxFee += fee.suggestedMaxFee;

        acc.resourceBounds.l1_gas.max_amount += BigInt(
          fee.resourceBounds.l1_gas.max_amount ?? '0',
        );
        acc.resourceBounds.l1_gas.max_price_per_unit += BigInt(
          fee.resourceBounds.l1_gas.max_price_per_unit ?? '0',
        );
        acc.resourceBounds.l2_gas.max_amount += BigInt(
          fee.resourceBounds.l2_gas?.max_amount ?? '0',
        );
        acc.resourceBounds.l2_gas.max_price_per_unit += BigInt(
          fee.resourceBounds.l2_gas?.max_price_per_unit ?? '0',
        );
        if (fee.resourceBounds.l1_data_gas) {
          if (!acc.resourceBounds.l1_data_gas) {
            acc.resourceBounds.l1_data_gas = {
              max_amount: BigInt(0),
              max_price_per_unit: BigInt(0),
            };
          }
          acc.resourceBounds.l1_data_gas.max_amount += BigInt(
            fee.resourceBounds.l1_data_gas.max_amount ?? '0',
          );
          acc.resourceBounds.l1_data_gas.max_price_per_unit += BigInt(
            fee.resourceBounds.l1_data_gas.max_price_per_unit ?? '0',
          );
        }
        return acc;
      },
      {
        overallFee: BigInt(0),
        suggestedMaxFee: BigInt(0),
        resourceBounds: {
          l1_gas: {
            max_amount: BigInt(0),
            max_price_per_unit: BigInt(0),
          },
          l2_gas: {
            max_amount: BigInt(0),
            max_price_per_unit: BigInt(0),
          },
        },
      },
    );

    return {
      overallFee: consolidateResult.overallFee,
      suggestedMaxFee: consolidateResult.suggestedMaxFee,
      resourceBounds: consolidateResult.resourceBounds,
    };
  }

  /**
   * Serialize the consolidated fees result into a Object that contains suggestedMaxFee, overallFee and resourceBounds in string.
   *
   * @returns A serializated object.
   */
  serializate(): SerializatedConsolidatedFees {
    const resourceBounds: ResourceBounds = {
      // convert to hex string for serialization in starknet.js when using STRK token to pay the fee.
      l1_gas: {
        max_amount: numUtils.toHexString(this.resourceBounds.l1_gas.max_amount),
        max_price_per_unit: numUtils.toHexString(
          this.resourceBounds.l1_gas.max_price_per_unit,
        ),
      },
      l2_gas: {
        max_amount: numUtils.toHexString(this.resourceBounds.l2_gas.max_amount),
        max_price_per_unit: numUtils.toHexString(
          this.resourceBounds.l2_gas.max_price_per_unit,
        ),
      },
      l1_data_gas: {
        max_amount: numUtils.toHexString(
          this.resourceBounds.l1_data_gas?.max_amount ?? BigInt(0),
        ),
        max_price_per_unit: numUtils.toHexString(
          this.resourceBounds.l1_data_gas?.max_price_per_unit ?? BigInt(0),
        ),
      },
    };
    return {
      suggestedMaxFee: this.suggestedMaxFee.toString(10),
      overallFee: this.overallFee.toString(10),
      resourceBounds,
    };
  }
}
/* eslint-enable */
