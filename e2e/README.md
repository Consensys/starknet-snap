# Jest Playwright Typescript example

## Showcases

- [github.com](https://github.com/playwright-community/playwright-jest-examples/blob/master/basic-ts/tests/github.test.ts)
- [example.com](https://github.com/playwright-community/playwright-jest-examples/blob/master/basic-ts/tests/example.test.ts)

## Used tools

- [jest-playwright](https://github.com/playwright-community/jest-playwright) - integrates Jest and Playwright
- [expect-playwright](https://github.com/playwright-community/expect-playwright) - provides useful expect statements
- [Jest](https://jestjs.io) - provides the testing suite
- [ts-jest](https://github.com/kulshekhar/ts-jest) - provides support for TypeScript

## Local setup
 - To build the project locally, run the regular: yarn install

 - Then, need to unzip MetaMask Flask chrome extension in e2e/extension.zip
   After you unzip the file, you should rename the code source repo with "extension-source" and put it in e2e/extension-source

 -To run test locally, go to e2e repo, run : 
 yarn test tests/*.test.ts