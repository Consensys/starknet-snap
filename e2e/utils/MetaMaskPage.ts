import { Page } from "playwright";
export default class MetaMaskPage {
  public page: Page;

  constructor(page: Page) {
    this.page = page; 
  }

  ConfirmButtonInModal = `data-testid=page-container-footer-next`;

  async loginMetaMaskUI(): Promise<void> {
    await this.page.locator('text=I accept the risks').click();
    await this.page.locator('text=Import wallet').click();
    await this.page.locator('text=I Agree').click();

    // TODO: to replace hard-coded account by ones defined in file users.config.ts
    await this.page.locator('#import-srp__srp-word-0').fill('water');
    await this.page.locator('#import-srp__srp-word-1').fill('cheese');
    await this.page.locator('#import-srp__srp-word-2').fill('surprise');
    await this.page.locator('#import-srp__srp-word-3').fill('replace');
    await this.page.locator('#import-srp__srp-word-4').fill('battle');
    await this.page.locator('#import-srp__srp-word-5').fill('teach');
    await this.page.locator('#import-srp__srp-word-6').fill('about');
    await this.page.locator('#import-srp__srp-word-7').fill('assist');
    await this.page.locator('#import-srp__srp-word-8').fill('inside');
    await this.page.locator('#import-srp__srp-word-9').fill('coconut');
    await this.page.locator('#import-srp__srp-word-10').fill('unfair');
    await this.page.locator('#import-srp__srp-word-11').fill('economy');
    await this.page.locator('#password').fill('vWgeGXAv6h!Tzuf');
    await this.page.locator('#confirm-password').fill('vWgeGXAv6h!Tzuf');
    await this.page.locator('#create-new-vault__terms-checkbox').click()
    await this.page.waitForTimeout(1000);

    await this.page.locator('#app-content > div > div.main-container-wrapper > div > div > div.first-time-flow__import > form > button').click();
    await this.page.locator('text=All Done').click();
    await this.page.locator('data-testid=popover-close').click();
  }

  async confirmConnectUI(): Promise<void> {
    await this.page.bringToFront();
    await this.page.waitForTimeout(1000);
    await this.page.reload();
    await this.page.locator(this.ConfirmButtonInModal).click();
    await this.page.waitForTimeout(1000);
    await this.page.reload();

    try {
      await this.page.waitForSelector(this.ConfirmButtonInModal, {timeout: 4000});
    }
    catch (error){
      await this.page.reload();
      await this.page.waitForSelector(this.ConfirmButtonInModal, {timeout: 3000});
    }
    await this.page.locator(this.ConfirmButtonInModal).click();

    await this.page.locator('#warning-accept').click();
    await this.page.locator('div > button.button.btn--rounded.btn-primary.snap-install-warning__footer-button').click();
    //TODO: add connected check for metaMask page
  }

  async confirmExportPrivateKey(): Promise<void> {
    await this.page.reload()
    await this.page.locator('//button[text()="Approve"]').click();
    await this.page.reload()
    await this.page.waitForSelector('//h3[text()="StarkNet Account Private Key"]');
    await this.page.waitForSelector('//textarea[contains(text(), "0x")]');
    await this.page.reload()
    await this.page.locator('//button[text()="Approve"]').click();
  }

  async confirmSendToken(): Promise<void> {
    await this.page.reload()
    await this.page.waitForSelector('//h3[contains(text(), "Do you want to sign this transaction")]')
    await this.page.locator('//button[text()="Approve"]').click();
  }
}
