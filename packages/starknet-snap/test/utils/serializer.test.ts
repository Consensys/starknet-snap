import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { toJson } from '../../src/utils/serializer';
chai.use(sinonChai);

describe('Test function: toJson', function () {
  it('should convert object to string', async function () {
    const expectedResult = '{"r":1,"s":"2","v":{"t":"4"}}';
    const result = toJson({ r: 1, s: '2', v: { t: '4' } });
    expect(result).to.be.eql(expectedResult);
  });

  it('should convert object with bigInt to string', async function () {
    const expectedResult =
      '{"r":1,"s":"2","t":"2561146817694037944268364036216184626484657582211188385622551558011813041058","v":{"t":"2561146817694037944268364036216184626484657582211188385622551558011813041058"}}';
    const result = toJson({
      r: 1,
      s: '2',
      t: BigInt('0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2'),
      v: { t: BigInt('0x05a98ec74a40383cf99896bfea2ec5e6aad16c7eed50025a5f569d585ebb13a2') },
    });
    expect(result).to.be.eql(expectedResult);
  });
});
