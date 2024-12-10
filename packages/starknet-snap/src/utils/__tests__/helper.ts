import { generateEstimateFeesResponse } from '../../__tests__/helper';
import { ConsolidateFees } from '../fee';
import * as starknetUtils from '../starknetUtils';

/**
 *
 */
export function mockEstimateFeeBulkResponse() {
  const estimateFeesResponse = generateEstimateFeesResponse();

  const consolidatedFeesObj = new ConsolidateFees(estimateFeesResponse);
  const consolidatedFees = consolidatedFeesObj.serializate();

  const estimateBulkFeeSpy = jest.spyOn(starknetUtils, 'estimateFeeBulk');
  estimateBulkFeeSpy.mockResolvedValue(estimateFeesResponse);

  return {
    estimateBulkFeeSpy,
    estimateFeesResponse,
    consolidatedFees,
  };
}
