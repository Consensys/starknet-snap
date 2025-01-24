import { BrowserContext } from "playwright";
import { test, expect } from '@playwright/test';
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { createBrowserContext, getTestUrl } from '../conf/test-helpers';

test.describe('Starknet dapp should be able to show account on voyager explorer', () => {
  let browserContext: BrowserContext;
  let metaMaskPage: MetaMaskPage;
  let applicationPage: DappPage;

  test.beforeEach(async () => {
    browserContext = await createBrowserContext();
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

    await applicationPage.page.goto(getTestUrl());
    await applicationPage.clickConnectButton();
    await metaMaskPage.confirmConnectUI();
    await applicationPage.page.waitForSelector('//*[contains(text(),"Send")]', {timeout: 90000});

    // Verify account adddress information and check user can copy address
    await applicationPage.page.bringToFront();
    await applicationPage.page.waitForTimeout(1000);
    await applicationPage.checkCopyAddress();

    // Check user can view account on voyager explorer
    await applicationPage.checkViewOnExplorer();
  });
});