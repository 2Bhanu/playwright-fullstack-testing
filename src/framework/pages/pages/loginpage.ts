import { Page } from '@playwright/test';

import { BasePage } from '../base/basepage';

export class LoginPage extends BasePage {
  
  
  endpoint: string = '/login';
  usernameLocator: this;
  passwordLocator: this;
  submitButtonLocator: this;

  constructor(page: Page) {
    super(page);
    this.usernameLocator = this.textbox({ name: 'Username' });
    this.passwordLocator = this.textbox({ name: 'Password' });
    this.submitButtonLocator = this.button({ name: 'Submit' });
    this.readyLocator = this.usernameLocator;
  }

  async login(username: string, password: string) {
    await this.usernameLocator.fill(username);
    await this.passwordLocator.fill(password);
    await this.submitButtonLocator.click();
  }
}