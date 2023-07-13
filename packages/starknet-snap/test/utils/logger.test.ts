import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import * as logutils from '../../src/utils/logger';

chai.use(sinonChai);

describe('Test function: logger', function () {
  const logFnSpy = {
    log: () => sinon.stub(console, 'log'),
    error: () => sinon.stub(console, 'error'),
    warn: () => sinon.stub(console, 'warn'),
    info: () => sinon.stub(console, 'info'),
    trace: () => sinon.stub(console, 'trace'),
    debug: () => sinon.stub(console, 'debug'),
  };
  const spyempty = () => sinon.stub(logutils, 'emptyLog');
  
  afterEach(function () {
    sinon.restore();
    sinon.reset();
  });

  it('when log level set to all, should log every level correctly', function () {
    const spy = {};
    for (const key in logFnSpy) {
      spy[key] = logFnSpy[key]();
    }

    logutils.logger.init('all');

    for (const key in logFnSpy) {
      logutils.logger[key]('log');
      expect(spy[key]).to.have.been.calledOnceWith('log');
    }
  });

  it('when log level set to off, should not log', function () {
    const spy = {};
    for (const key in logFnSpy) {
      spy[key] = logFnSpy[key]();
    }
    const _emptySpy = spyempty();

    logutils.logger.init('off');
    for (const key in logFnSpy) {
      logutils.logger[key]('log');
      expect(spy[key]).to.have.been.callCount(0);
    }
    expect(_emptySpy).to.have.been.callCount(6);
  });

  it('when log level set to info, should log correctly', function () {
    const spy = {};
    for (const key in logFnSpy) {
      spy[key] = logFnSpy[key]();
    }
    const _emptySpy = spyempty();

    logutils.logger.init('info');
    for (const key in logFnSpy) {
      logutils.logger[key](`log: ${key}`);
    }
    expect(spy['info']).to.have.been.calledOnceWith('log: info');
    expect(spy['warn']).to.have.been.calledOnceWith('log: warn');
    expect(spy['error']).to.have.been.calledOnceWith('log: error');
    expect(_emptySpy).to.have.been.callCount(3);
  });
});
