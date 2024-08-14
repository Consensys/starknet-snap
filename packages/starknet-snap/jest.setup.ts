import { MockSnapProvider } from './test/snap-provider.mock';

// eslint-disable-next-line no-restricted-globals
const globalAny: any = global;

globalAny.snap = new MockSnapProvider();
