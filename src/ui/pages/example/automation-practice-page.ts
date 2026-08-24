import { Page } from '@playwright/test';

import { BasePage } from '../base/base-page';

export class AutomationPracticePage extends BasePage {

  endpoint: string = '';

  readonly nameLocator = this.simplifiedLocator.textbox({ name: 'Enter Name' }).setAsPageReadyIdentifier();
  readonly emailLocator = this.simplifiedLocator.textbox({ name: 'Enter EMail' });
  readonly phoneLocator = this.simplifiedLocator.textbox({ name: 'Enter Phone' });
  readonly addressLocator = this.simplifiedLocator.textbox({ name: 'Address:' });

  constructor(page: Page) {
    super(page);
  }
}
