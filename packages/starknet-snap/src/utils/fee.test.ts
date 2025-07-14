import { constants, num as numUtils } from 'starknet';

import { generateEstimateFeesResponse } from '../__tests__/helper';
import type { ResourceBounds } from '../types/snapState';
import { ConsolidateFees } from './fee';

/* eslint-disable @typescript-eslint/naming-convention */
describe('ConsolidateFees', () => {
  const consolidateFees = (fees) => {
    return fees.reduce(
      (acc, fee) => {
        acc.overallFee += fee.overall_fee;
        acc.suggestedMaxFee += fee.suggestedMaxFee;

        acc.resourceBounds.l1_gas.max_amount += BigInt(
          fee.resourceBounds.l1_gas.max_amount,
        );
        acc.resourceBounds.l1_gas.max_price_per_unit += BigInt(
          fee.resourceBounds.l1_gas.max_price_per_unit,
        );
        acc.resourceBounds.l2_gas.max_amount += BigInt(
          fee.resourceBounds.l2_gas.max_amount,
        );
        acc.resourceBounds.l2_gas.max_price_per_unit += BigInt(
          fee.resourceBounds.l2_gas.max_price_per_unit,
        );

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
          l1_data_gas: {
            max_amount: BigInt(0),
            max_price_per_unit: BigInt(0),
          },
        },
      },
    );
  };

  it('consolidates fees', () => {
    const fees = generateEstimateFeesResponse(
      constants.StarknetChainId.SN_MAIN,
    );
    const consolidatedFeesObj = new ConsolidateFees(fees);

    const { overallFee, suggestedMaxFee, resourceBounds } =
      consolidateFees(fees);

    expect(consolidatedFeesObj.overallFee).toStrictEqual(overallFee);
    expect(consolidatedFeesObj.suggestedMaxFee).toStrictEqual(suggestedMaxFee);
    expect(consolidatedFeesObj.resourceBounds).toStrictEqual(resourceBounds);
  });

  describe('serializate', () => {
    it('serializes fees', () => {
      const fees = generateEstimateFeesResponse();
      const consolidatedFeesObj = new ConsolidateFees(fees);

      const serializedFee = consolidatedFeesObj.serializate();
      const resourceBounds: ResourceBounds = {
        l1_gas: {
          max_amount: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l1_gas.max_amount,
          ),
          max_price_per_unit: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l1_gas.max_price_per_unit,
          ),
        },
        l2_gas: {
          max_amount: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l2_gas.max_amount,
          ),
          max_price_per_unit: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l2_gas.max_price_per_unit,
          ),
        },
        l1_data_gas: {
          max_amount: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l1_data_gas?.max_amount ?? '0',
          ),
          max_price_per_unit: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l1_data_gas
              ?.max_price_per_unit ?? '0',
          ),
        },
      };
      if (consolidatedFeesObj.resourceBounds.l1_data_gas) {
        resourceBounds.l1_data_gas = {
          max_amount: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l1_data_gas.max_amount,
          ),
          max_price_per_unit: numUtils.toHexString(
            consolidatedFeesObj.resourceBounds.l1_data_gas.max_price_per_unit,
          ),
        };
      }
      expect(serializedFee).toStrictEqual({
        overallFee: consolidatedFeesObj.overallFee.toString(10),
        suggestedMaxFee: consolidatedFeesObj.suggestedMaxFee.toString(10),
        resourceBounds,
      });
    });
  });
});
/* eslint-enable */
