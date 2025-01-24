import { chromium, BrowserContext } from "playwright";
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { URL } from '../conf/configuration';
import { test } from '@playwright/test';
import { createBrowserContext, getTestUrl } from '../conf/test-helpers';

test.describe('Starknet dapp should be able to add token and should be able to recover the account', () => {
  let browserContext: BrowserContext;
  let metaMaskPage: MetaMaskPage;
  let applicationPage: DappPage;

  test.beforeEach(async () => {
    browserContext = await createBrowserContext();
  });

  test.afterEach(async () => {
    await browserContext.close();
  });

  test('Add token in Dapp and test account recovery', async () => {
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
    await applicationPage.page.bringToFront();
    await applicationPage.page.waitForSelector('//*[contains(text(),"Send")]', {timeout: 90000});

    // Add token
    await applicationPage.openAddTokenModal();
    await applicationPage.addWBTCtoken();
    await applicationPage.checkWBTCtokenIsAdded();

    // TODO: Add recovery account step and check if added token is shown
  });
});