import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

import { Env } from '@/config/env';
import { SimplifiedLocator } from '@/framework/core/simplified_locator';
import { utils } from '@/framework/utils/utils';






export abstract class BasePage {

  protected endpoint!: string;
  protected readyLocator!: SimplifiedLocator;
  protected readonly simplifiedLocator!: SimplifiedLocator;

  constructor(protected readonly page: Page) { 
      this.simplifiedLocator = new SimplifiedLocator(page);
  }

  getPage(){
    return this.page;
  }

  async closeBrowser(){
    await this.page.context().close();
  }

  //navigation helper
  async navigate(options?: {
    baseURL?: string;
    pageLoadCheck?: boolean;
  }) {
    //set defaults
    const baseURL = options?.baseURL ?? Env.fsrBaseHost;
    const pageLoadCheck = options?.pageLoadCheck ?? true;
    //Navigate and conditionally validate page load
    await this.page.goto(utils.buildUrl(this.endpoint, baseURL));
    if (pageLoadCheck) {
      await this.readyLocator.expectedToBeVisible();
    }
    else{
      
    }
  }
}