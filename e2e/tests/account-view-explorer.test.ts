import { chromium, BrowserContext } from "playwright";
import { test, expect } from '@playwright/test';
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { URL } from '../conf/configuration';

test.describe('Starknet dapp should be able to show account on voyager explorer', () => {
  let browserContext: BrowserContext;
  let metaMaskPage: MetaMaskPage;
  let applicationPage: DappPage;

  //TODO: Put the beforeEach in config file that all tests can use
  test.beforeEach(async () => {
    const extensionPath = require('path').join(__dirname, '../extension-source')
    browserContext = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
  });

  test.afterEach(async () => {
    await browserContext.close();
  });

  test('Show account on voyager explorer check', async () => {
    // User connect Dapp to Metamask
    const [extensionPage] = await Promise.all([browserContext.waitForEvent('page')]);
    await extensionPage.waitForLoadState();
    await extensionPage.reload();
    metaMaskPage = new MetaMaskPage(extensionPage);
    await metaMaskPage.loginMetaMaskUI();
    
    const pages = browserContext.pages();
    const dappPage = pages[0];
    applicationPage = new DappPage(dappPage);
    await applicationPage.page.bringToFront();
    await applicationPage.page.waitForTimeout(1000);

    // TODO: Put the DEV parameter in environmental variable
    await applicationPage.page.goto(URL.DEV);
    await applicationPage.clickConnectButton();
    await metaMaskPage.confirmConnectUI();
    await applicationPage.page.waitForSelector('//*[contains(text(),"Send")]', {timeout: 90000});

    // Verify account adddress information and check user can copy address
    await applicationPage.page.bringToFront();
    await applicationPage.page.waitForTimeout(1000);
    await applicationPage.checkCopyAddress();
    await applicationPage.checkAccountInfo();

    // Check view on explorer link for account
    await applicationPage.clickViewOnExplorerLink();
    const [accountPage] = await Promise.all([browserContext.waitForEvent('page')]);
    expect(accountPage.url()).toContain('/voyager.online/contract/0x');
    await accountPage.close()
  });
});