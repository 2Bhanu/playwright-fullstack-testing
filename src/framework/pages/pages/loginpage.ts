import { Page } from '@playwright/test';

import { BasePage } from '../base/basepage';

export class LoginPage extends BasePage {


  endpoint: string = '/login';
  usernameLocator = this.simplifiedLocator.textbox({ name: 'Username' }).setAsPageReadyIdentifier();
  passwordLocator = this.simplifiedLocator.textbox({ name: 'Password' });
  submitButtonLocator = this.simplifiedLocator.button({ name: 'Submit' });

  constructor(page: Page) {
    super(page);
  }



  async login(username: string, password: string) {
    await this.usernameLocator.fill(username);
    await this.passwordLocator.fill(password);
    await this.submitButtonLocator.click();
  }
}