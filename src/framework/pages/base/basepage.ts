import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

import { Env } from '@/config/env';
import { utils } from '@/framework/utils/utils';


type Role =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'dialog'
  | 'grid'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listitem'
  | 'menu'
  | 'menuitem'
  | 'navigation'
  | 'option'
  | 'radio'
  | 'row'
  | 'rowheader'
  | 'searchbox'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tabpanel'
  | 'textbox';

interface RoleOptions {
  checked?: boolean;
  disabled?: boolean;
  exact?: boolean;
  expanded?: boolean;
  includeHidden?: boolean;
  level?: number;
  name?: string | RegExp;
  pressed?: boolean;
  selected?: boolean;
}

type LocatorOptions = Parameters<Page['locator']>[1];
type FilterOptions = Parameters<Locator['filter']>[0];

export abstract class BasePage {

  protected currentLocator: Locator | null = null;
  protected endpoint!: string;
  protected readyLocator!: this;


  constructor(protected readonly page: Page) { }

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
      await expect(this.readyLocator.resolveLocator()).toBeVisible();
    }
  }

  // =========================
  // INTERNAL CHAIN HELPERS
  // =========================

  protected chain(
    builder: (root: Page | Locator) => Locator
  ): this {

    const root =
      this.currentLocator ?? this.page;

    this.currentLocator = builder(root);

    return this;
  }

  protected resolveLocator(resetCurrentLocator = true): Locator {

    const temp = this.currentLocator;

    if (resetCurrentLocator) {
      this.currentLocator = null;
    }

    if (temp == null) {
      throw new Error(
        'No locator found. Please create a locator chain first.'
      );
    }

    return temp;
  }

  //General purpose locator method to create a locator chain. This is useful for creating locators that do not fit into the role-based or text-based categories.
  protected locator(
    selector: string,
    options?: LocatorOptions
  ): this {


    return this.chain(
      root => root.locator(selector, options)
    );
  }

  // filter method to filter the current locator chain based on the provided options. This is useful for narrowing down the results of a locator chain.
  protected filter(options?: FilterOptions): this {
    return this.chain(
      () => this.resolveLocator(false).filter(options)
    );
  }


  // =========================
  // ROLE LOCATORS
  // =========================

  protected role(
    role: Role,
    options?: RoleOptions
  ): this {

    return this.chain(
      root => root.getByRole(role, options)
    );
  }

  protected button(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('button', options);
  }

  protected textbox(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('textbox', options);
  }

  protected checkbox(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('checkbox', options);
  }

  protected row(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('row', options);
  }

  protected cell(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('cell', options);
  }

  protected link(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('link', options);
  }

  protected heading(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): this {

    return this.role('heading', options);
  }

  // =========================
  // TEXT-BASED LOCATORS
  // =========================

  protected text(
    text: string | RegExp,
    options?: {
      exact?: boolean;
    }
  ): this {

    return this.chain(
      root => root.getByText(text, options)
    );
  }

  protected label(
    text: string | RegExp,
    options?: {
      exact?: boolean;
    }
  ): this {

    return this.chain(
      root => root.getByLabel(text, options)
    );
  }

  protected placeholder(
    text: string | RegExp,
    options?: {
      exact?: boolean;
    }
  ): this {

    return this.chain(
      root => root.getByPlaceholder(text, options)
    );
  }

  protected testId(testId: string): this {

    return this.chain(
      root => root.getByTestId(testId)
    );
  }

 

  // =========================
  // ACTIONS
  // =========================

  async click(): Promise<this> {
    await this.resolveLocator().click();
    return this;
  }

  async fill(value: string): Promise<this> {
    await this.resolveLocator().fill(value);
    return this;
  }

  async hover(): Promise<this> {
    await this.resolveLocator().hover();
    return this;
  }

  async check(): Promise<this> {
    await this.resolveLocator().check();
    return this;
  }

  async uncheck(): Promise<this> {
    await this.resolveLocator().uncheck();
    return this;
  }

  async press(key: string): Promise<this> {
    await this.resolveLocator().press(key);
    return this;
  }

  async focus(): Promise<this> {
    await this.resolveLocator().focus();
    return this;
  }

  async dblclick(): Promise<this> {
    await this.resolveLocator().dblclick();
    return this;
  }

  async textContent(): Promise<string | null> {
    return await this.resolveLocator().textContent();
  }

  async innerText(): Promise<string> {
    return await this.resolveLocator().innerText();
  }

  async isVisible(): Promise<boolean> {
    return await this.resolveLocator().isVisible();
  }

  async isHidden(): Promise<boolean> {
    return await this.resolveLocator().isHidden();
  }

  async isEnabled(): Promise<boolean> {
    return await this.resolveLocator().isEnabled();
  }

  async isDisabled(): Promise<boolean> {
    return await this.resolveLocator().isDisabled();
  }

  async count(): Promise<number> {
    return await this.resolveLocator().count();
  }

}