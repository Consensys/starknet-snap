import { Page } from "playwright";

export default class DappPage {
  public page: Page;

  constructor(page: Page) {
    this.page = page; 
  }

  ConnectButton = `//*[text()="Connect with MetaMask Flask"]`;
  BalanceValue = `#root > div > div > div.sc-gHLcSH.eQkxgj > div.sc-jtcaXd.gRiExi > div.sc-elYLMi.ifySaH > div.sc-fLlhyt.fvAMhi > div.sc-bczRLJ.dWqeJI > span.sc-gsnTZi.bZeyGO`;
  MainnetLabel = `//*[text()="StarkNet Mainnet"]`;
  BurgerMenu = `//*[@id="headlessui-menu-button-:r2:"]/div`;
  CopyAddressButton = `//*[@id="root"]/div/div/div[2]/div[5]/div[1]/div[4]/div[2]/div/button/span`;
  AccountIcon = `//h3[text()="My account"]/../div/div[1]/div[1]`;
  ReceiveButton = `//*[text()="Receive"]`;
  SendButton = `//*[text()="Send"]`;

  async disconnectDapp(): Promise<void> {
    await this.page.locator(this.BurgerMenu).click();
    await this.page.locator('//*[text()="Disconnect"]').click();
  }

  async clickConnectButton(): Promise<void> {
    await this.page.locator(this.ConnectButton).click();
  }

  async checkConnectButtonDisplayed(): Promise<void> {
    await this.page.locator(this.ConnectButton).waitFor({ state: 'visible' });
  }

  async checkHomepageDisplay(): Promise<void> {
    await this.page.waitForSelector("//*[@id='root']/div/div/div[1]/div[1]/img")
    await this.page.waitForSelector('//*[text()="My account"]')
    await this.page.waitForSelector('//*[text()="Ether"]')
    await this.page.waitForSelector('//*[text()="Deploy"]')
    await this.page.waitForSelector(this.ReceiveButton)
    await this.page.waitForSelector(this.SendButton)
    await this.page.waitForSelector(this.BalanceValue)
  }

  async checkMainnetIsDisplayed(): Promise<void> {
    await this.page.waitForSelector(this.MainnetLabel)
  }

  async checkTestnetIsDisplayed(): Promise<void> {
    await this.page.locator('//*[text()="Goerli Testnet"]').waitFor({ state: 'visible' });
  }

  async switchtoTestnetNetwork(): Promise<void> {
    await this.page.locator(this.MainnetLabel).click();
    await this.page.locator('//input[@aria-label="Goerli Testnet"]').click()
  }

  async checkUserIsconnected(): Promise<void> {
    await this.page.locator(this.BurgerMenu).click();
    await this.page.waitForSelector('//*[text()="Connected to StarkNet Snap"]')
  }

  async waitForLodingPage(): Promise<void> {
    await this.page.locator('//*[contains(text(), "Getting network")]').waitFor({ state: 'visible' });
    await this.page.locator('//*[contains(text(), "Getting network")]').waitFor({ timeout: 60000, state: 'hidden' });
    await this.page.locator('//*[contains(text(), "Retrieving")]').waitFor({ timeout: 60000, state: 'hidden' });
  }

  async clickAboutThisSnapLink(): Promise<void> {
    await this.page.locator('//*[text()="About this snap"]').click();
  }

  async checkCopyAddress(): Promise<void> {
    await this.page.locator(this.CopyAddressButton).hover();
    await this.page.locator('//*[contains(text(), "Copy to clipboard")]').waitFor({ state: 'visible' });
    await this.page.locator(this.CopyAddressButton).click();
    await this.page.locator('//*[contains(text(), "Copied")]').waitFor({ state: 'visible' });
  }

  async checkAccountInfo(): Promise<void> {
    await this.page.locator('//*[@id="root"]/div/div/div[2]/div[5]/div[1]/div[4]/div[1]').click();
    await this.page.waitForSelector('//*[text()="Network"]');
    await this.page.waitForSelector('//*[text()="StarkNet account"]');
    await this.page.waitForSelector('//div[contains(text(), "0x")]');
    await this.page.waitForSelector('//*[text()="This account was generated with your MetaMask Secret Recovery Phrase."]');
    await this.page.locator('//*[contains(text(), "GOT IT")]').click();
  }

  async clickAccountDetailsIcon(): Promise<void> {
    await this.page.locator(this.AccountIcon).click();
  }
  
  async clickViewOnExplorerLink(): Promise<void> {
    await this.clickAccountDetailsIcon();
    await this.page.locator('//*[contains(text(), "View on explorer")]').click();
  }

  async openAccountDetailsModal(): Promise<void> {
    await this.clickAccountDetailsIcon();
    await this.page.locator('//*[text()="Account details"]').click();
  }

  async checkAccountDetailsModalDisplay(): Promise<void> {
    await this.page.waitForSelector('//div[text()="My account"]');
    // TODO: Add check for Qr code check and copy address check
  }

  async clickViewOnExplorerLinkInAccountModal(): Promise<void> {
    await this.page.locator('//*[text()="VIEW ON EXPLORER"]').click();
  }

  async clickExportPrivateKey(): Promise<void> {
    await this.page.locator('//*[text()="EXPORT PRIVATE KEY"]').click()
  }

  async openAddTokenModal(): Promise<void> {
    await this.page.locator('//*[text()="ADD TOKEN"]').click();
    await this.page.waitForSelector('//div[text()="Add Token"]');
  }

  async addWBTCtoken(): Promise<void> {
    await this.page.fill('//span[text()="ContractAddress"]/../..//input', '0x12d537dc323c439dc65c976fad242d5610d27cfb5f31689a0a319b8be7f3d56')
    await this.page.fill('//span[text()="Name"]/../..//input', 'Wrapped BTC')
    await this.page.fill('//span[text()="Symbol"]/../..//input', 'WBTC')
    await this.page.fill('//span[text()="Decimal"]/../..//input', '8')
    await this.page.locator('//*[text()="ADD"]').click()
  }

  async checkWBTCtokenIsAdded(): Promise<void> {
    await this.page.waitForSelector('//*[contains(text(), "Token added successfully")]');
    await this.page.waitForSelector('//span[text()="Wrapped BTC"]');
  }

  async clickReceiveButton(): Promise<void> {
    await this.page.locator(this.ReceiveButton).click();
  }

  async closeReceiveModal(): Promise<void> {
    await this.page.locator('//div[text()="Receive"]/../../button').click();
  }

  async checkReceiveModalDisplay(): Promise<void> {
    await this.page.waitForSelector('//div[text()="Receive"]');
    // TODO: add check for Qr code check and copy address in this modal
  }

  async openSendTokenModal(): Promise<void> {
    await this.page.waitForSelector(this.SendButton);
    await this.page.locator(this.SendButton).click();
  }

  async fillSendTokenModal(address:string, amount:string): Promise<void> {
    await this.page.fill("//input[@placeholder='Paste recipient address here']", address);
    await this.page.waitForTimeout(1000);
    await this.page.locator("//span[text()='Amount']/../..//input").click();
    await this.page.locator("//span[text()='Amount']/../..//input").type(amount);
    await this.page.waitForTimeout(2000);
    await this.page.locator('//span[text()="CONFIRM"]').click();
    await this.page.locator('//*[text()="CONFIRM"]').click();
  }

  async verifyTokenIsSent(): Promise<void> {
    await this.page.waitForSelector('//*[contains(text(), "Transaction sent successfully")]', {timeout: 90000});
  }
}
