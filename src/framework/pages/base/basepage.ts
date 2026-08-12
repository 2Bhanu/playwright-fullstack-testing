import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

import { Env } from '@/config/env';
import { SimplifiedLocator } from '@/framework/core/simplified_locator';
import { logger } from '@/framework/logging/logger';
import { utils } from '@/framework/utils/utils';






export abstract class BasePage {

  protected endpoint!: string;
  protected readyLocator!: SimplifiedLocator;
  protected readonly simplifiedLocator!: SimplifiedLocator;

  constructor(protected readonly page: Page) {
    this.simplifiedLocator = new SimplifiedLocator(page, undefined, this);

    // Wrap this instance in a Proxy so that reading any
    // SimplifiedLocator-valued property automatically stamps its
    // property name. Action methods on SimplifiedLocator then log
    // `Clicked <propertyName>` etc. without any call-site changes.
    //
    // The Proxy is returned from the constructor, replacing `this`
    // for the caller. Subclass field initializers run during the
    // implicit `super()` phase and populate the raw `this`, so by
    // the time the Proxy is in place all locator properties are
    // already defined. The prototype chain is preserved, so
    // `instanceof BasePage` keeps working.
    //
    // The internal `simplifiedLocator` field is excluded: it is
    // the builder entry point, never used as a real locator, and
    // stamping it would leak its name into every chained locator
    // via SimplifiedLocator.wrap(). That would make all locators
    // log as "simplifiedLocator" because the first-name-wins
    // guard on setName() blocks any later rename.
    //
    // `readyLocator` is also excluded: it is set via
    // setAsPageReadyIdentifier() during field initialization,
    // and the SAME locator instance is later assigned to a named
    // field like `nameLocator`. `navigate()` reads `readyLocator`
    // first, which would stamp the locator as "readyLocator" and
    // the first-name-wins guard would then block the rename to
    // the user-visible name when the test reads `nameLocator`.
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string' &&
            (prop === 'simplifiedLocator' || prop === 'readyLocator')) {
          return Reflect.get(target, prop, receiver);
        }
        const value = Reflect.get(target, prop, receiver);
        if (value instanceof SimplifiedLocator) {
          value.setName(String(prop));
        }
        return value;
      },
    });
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