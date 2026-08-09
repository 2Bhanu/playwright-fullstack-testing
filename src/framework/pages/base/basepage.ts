import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

import { Env } from '@/config/env';
import { SimplifiedLocator } from '@/framework/core/simplified_locator';
import { utils } from '@/framework/utils/utils';
import { logger } from '@/framework/logging/logger';






export abstract class BasePage {

  protected endpoint!: string;
  protected readyLocator!: SimplifiedLocator;
  protected readonly simplifiedLocator!: SimplifiedLocator;

  constructor(protected readonly page: Page) {
      this.simplifiedLocator = new SimplifiedLocator(page, undefined, this);
  }

  getPage(){
    return this.page;
  }

  async closeBrowser(){
    await this.page.context().close();
  }

  /**
   * Registers a locator as this page's page-ready identifier.
   *
   * Called by SimplifiedLocator.setAsPageReadyIdentifier() via the
   * owner reference passed at construction time.
   */
  setReadyLocator(locator: SimplifiedLocator): void {
    this.readyLocator = locator;
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
      if (!this.readyLocator) {
        logger.warn(`readyLocator is not defined for ${this.constructor.name}. Please define a readyLocator in the page class.`);
      }
      await this.readyLocator?.expectedToBeVisible();
    }
    else{
      logger.warn(`Page load check is disabled for ${this.constructor.name}.`);
    }
  }
}