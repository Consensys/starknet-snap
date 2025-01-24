import { chromium, BrowserContext } from "playwright";
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { URL } from '../conf/configuration';
import { test } from '@playwright/test';
import { createBrowserContext, getTestUrl } from '../conf/test-helpers';

test.describe('Starknet dapp should be able to send and receive token', () => {
  let browserContext: BrowserContext;
  let metaMaskPage: MetaMaskPage;
  let applicationPage: DappPage;

  test.beforeEach(async () => {
    browserContext = await createBrowserContext();
  });

  test.afterEach(async () => {
    await browserContext.close();
  });

  test('Send and receive token in Dapp', async () => {
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
    await applicationPage.page.locator('//*[contains(text(),"Send")]').waitFor({ state: 'visible', timeout: 90000 });

    // Click receive button to open receive address modal
    await applicationPage.clickReceiveButton();
    await applicationPage.checkReceiveModalDisplay();
    await applicationPage.closeReceiveModal();

    // User switch to testnet to send token
    await applicationPage.switchtoTestnetNetwork();
    await applicationPage.checkTestnetIsDisplayed();

    // Send token
    await applicationPage.waitForLodingPage();
    await applicationPage.openSendTokenModal();
    await applicationPage.fillSendTokenModal('0x228896bc607a05fd996e2dac3c43a80909b14622ba8210b84ed405a9acf0843', '0.000001');

    await metaMaskPage.page.bringToFront();
    await metaMaskPage.page.waitForTimeout(1000);
    await metaMaskPage.confirmSendToken();

    await applicationPage.verifyTokenIsSent();
  });
});