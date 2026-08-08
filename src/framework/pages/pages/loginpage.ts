import { Page } from '@playwright/test';

import { BasePage } from '../base/basepage';

export class LoginPage extends BasePage {
  
  
  endpoint: string = '/login';
  username = this.simplifiedLocator.textbox({ name: 'Username' })
  usernameLocator = this.simplifiedLocator.textbox({ name: 'Username' });
  passwordLocator = this.simplifiedLocator.textbox({ name: 'Password' });
  submitButtonLocator = this.simplifiedLocator.button({ name: 'Submit' });
  readyLocator = this.usernameLocator;

  constructor(page: Page) {
    super(page);
  }
  
  

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.passwordLocator.fill(password);
    await this.submitButtonLocator.click();
  }
}