import { chromium, BrowserContext } from "playwright";
import MetaMaskPage from "../utils/MetaMaskPage";
import DappPage from "../utils/DappPage";
import { URL } from '../conf/configuration';
import { test, expect } from '@playwright/test';

test.describe('Starknet dapp should be able to connect and disconnect to MetaMask flask', () => {
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

  test('Connect and disconnect dapp to MetaMask Flask', async () => {
    const [extensionPage] = await Promise.all([browserContext.waitForEvent('page')]);
    await extensionPage.waitForLoadState();
    await extensionPage.reload();

    metaMaskPage = new MetaMaskPage(extensionPage);
    await metaMaskPage.loginMetaMaskUI();

    // Click Connect 
    const pages = browserContext.pages();
    const dappPage = pages[0];

    applicationPage = new DappPage(dappPage);
    await applicationPage.page.bringToFront();
    await applicationPage.page.waitForTimeout(1000);

    //TODO: Put the DEV parameter in environmental variable
    await applicationPage.page.goto(URL.DEV);
    await applicationPage.clickConnectButton();
    await metaMaskPage.confirmConnectUI();
    
    // Check that user is connected to dApp and balance value is shown
    await applicationPage.page.bringToFront();
    await applicationPage.page.locator('//*[contains(text(),"Send")]').waitFor({ state: 'visible', timeout: 90000 });
    //TODO: contact devs to give clean testid on balance value element
    expect(await applicationPage.page.locator('#root > div > div > div.sc-gHLcSH.eQkxgj > div.sc-jtcaXd.gRiExi > div.sc-elYLMi.ifySaH > div.sc-fLlhyt.fvAMhi > div.sc-bczRLJ.dWqeJI > span.sc-gsnTZi.bZeyGO').count()).toBeTruthy();

    // Disconnect from dApp and check user is disconnected
    await applicationPage.disconnectDapp();
    await applicationPage.checkConnectButtonDisplayed();
  });
});