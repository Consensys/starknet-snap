import { chromium, BrowserContext } from "playwright";
import { test, expect } from '@playwright/test';
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { createBrowserContext, getTestUrl } from '../conf/test-helpers';

test.describe('Starknet dapp should be able to show account address details', () => {
  let browserContext: BrowserContext;
  let metaMaskPage: MetaMaskPage;
  let applicationPage: DappPage;

  test.beforeEach(async () => {
    browserContext = await createBrowserContext();
  });

  test.afterEach(async () => {
    await browserContext.close();
  });

  test('Dapp account address details check', async () => {
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

    // Check account details modal 
    await applicationPage.page.bringToFront();
    await applicationPage.page.waitForTimeout(1000);
    await applicationPage.openAccountDetailsModal();
    await applicationPage.checkAccountDetailsModalDisplay();

    // Check view on explorer link in account details modal
    await applicationPage.page.waitForTimeout(1000);
    await applicationPage.clickViewOnExplorerLinkInAccountModal();
    const [accountPage] = await Promise.all([browserContext.waitForEvent('page')]);
    expect(accountPage.url()).toContain('/voyager.online/contract/0x');
    await accountPage.close() 
  });
});