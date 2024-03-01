import { expect } from 'chai';
import { dappUrl } from '../../src/utils/snapUtils';

describe('Snap Utils', () => {
  it('should return the proper dapp URL based on the environment', () => {
    let envt = 'dev';
    expect(dappUrl(envt)).to.be.equal('https://dev.snaps.consensys.io/starknet');

    envt = 'staging';
    expect(dappUrl(envt)).to.be.equal('https://staging.snaps.consensys.io/starknet');

    envt = 'prod';
    expect(dappUrl(envt)).to.be.equal('https://snaps.consensys.io/starknet');
  });

  it('should return the PROD URL if invalid envt detected', () => {
    const envt = 'abc123';
    expect(dappUrl(envt)).to.be.equal('https://snaps.consensys.io/starknet');
  });

  it('should return the PROD URL if envt is undefined', () => {
    expect(dappUrl(undefined)).to.be.equal('https://snaps.consensys.io/starknet');
  });
});
