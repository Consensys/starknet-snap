import { chromium, BrowserContext } from "playwright";
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { URL } from '../conf/configuration';
import { test, expect } from '@playwright/test';

test.describe('Starknet dapp should be able to initilize account and have correct homepage display', () => {
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

  test('Dapp initialization and homepage display check', async () => {
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

    //TODO: Put the DEV parameter in environmental variable
    await applicationPage.page.goto(URL.DEV);
    await applicationPage.clickConnectButton();
    await metaMaskPage.confirmConnectUI();
    await applicationPage.page.bringToFront();
    await applicationPage.page.locator('//*[contains(text(),"Send")]').waitFor({ state: 'visible', timeout: 90000 });

    // Deploy and initiate account 
    await applicationPage.checkHomepageDisplay();
    
    // Check user can switch network
    await applicationPage.checkMainnetIsDisplayed();
    await applicationPage.switchtoTestnetNetwork();
    await applicationPage.checkTestnetIsDisplayed();

    // Check user can see connection status in the top right burger menu
    await applicationPage.waitForLodingPage();
    await applicationPage.checkUserIsconnected();

    // Check user is directed to infomation page when click about this snap link
    await applicationPage.clickAboutThisSnapLink()
    const [infoPage] = await Promise.all([browserContext.waitForEvent('page')]);
    expect(infoPage.url()).toContain('/metamask-integrates-starkware-into');
  });
});