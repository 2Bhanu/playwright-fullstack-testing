import {
  expect,
  Locator,
  Page,
} from '@playwright/test';

type Role = Parameters<Page['getByRole']>[0];
type RoleOptions = Parameters<Page['getByRole']>[1];

type LocatorOptions = Parameters<Page['locator']>[1];
type FilterOptions = Parameters<Locator['filter']>[0];

type TextOptions = Parameters<Page['getByText']>[1];
type LabelOptions = Parameters<Page['getByLabel']>[1];
type PlaceholderOptions = Parameters<Page['getByPlaceholder']>[1];

export class SimplifiedLocator {

  /**
   * The Playwright Page associated with this locator.
   *
   * Every SimplifiedLocator carries the page so that a root
   * SimplifiedLocator can create new Playwright locators.
   */
  private readonly page: Page;

  /**
   * The underlying Playwright Locator.
   *
   * null is valid only for the root SimplifiedLocator.
   *
   * Example:
   *
   * new SimplifiedLocator(page)
   *
   * represents the page-level root from which locators can be created.
   */
  private readonly target: Locator | null;

  // ============================================================
  // CONSTRUCTION
  // ============================================================

  /**
   * Creates a root SimplifiedLocator.
   *
   * This is normally created by BasePage:
   *
   * this.locator = new SimplifiedLocator(page);
   */
  constructor(page: Page);

  /**
   * Creates a SimplifiedLocator wrapping an existing Playwright
   * Locator.
   *
   * This constructor is primarily used internally for chaining.
   */
  constructor(page: Page, target: Locator);

  constructor(
    page: Page,
    target?: Locator
  ) {
    this.page = page;
    this.target = target ?? null;
  }

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================

  /**
   * Resolves the underlying Playwright Locator.
   *
   * A root SimplifiedLocator cannot be used directly for actions.
   * A locator-producing method must be called first.
   */
  private resolveLocator(): Locator {

    if (this.target === null) {
      throw new Error(
        'No locator has been created. ' +
        'Create a locator before performing an action.'
      );
    }

    return this.target;
  }

  /**
   * Wraps a Playwright Locator in a new SimplifiedLocator.
   *
   * The current SimplifiedLocator is never mutated.
   */
  private wrap(locator: Locator): SimplifiedLocator {
    return new SimplifiedLocator(this.page, locator);
  }

  // ============================================================
  // GENERAL LOCATORS
  // ============================================================

  /**
   * Creates a locator using a CSS, XPath or other Playwright
   * supported selector.
   *
   * Can be called from the root:
   *
   * this.locator('[data-test="user"]')
   *
   * or chained:
   *
   * this.row().locator('.username')
   */
  locator(
    selector: string,
    options?: LocatorOptions
  ): SimplifiedLocator {

    if (this.target === null) {
      return this.wrap(
        this.page.locator(selector, options)
      );
    }

    return this.wrap(
      this.resolveLocator().locator(selector, options)
    );
  }

  // ============================================================
  // ROLE LOCATORS
  // ============================================================

  role(
    role: Role,
    options?: RoleOptions
  ): SimplifiedLocator {

    if (this.target === null) {
      return this.wrap(
        this.page.getByRole(role, options)
      );
    }

    return this.wrap(
      this.resolveLocator().getByRole(role, options)
    );
  }

  button(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('button', options);
  }

  textbox(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('textbox', options);
  }

  checkbox(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('checkbox', options);
  }

  radio(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('radio', options);
  }

  link(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('link', options);
  }

  heading(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('heading', options);
  }

  row(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('row', options);
  }

  cell(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('cell', options);
  }

  dialog(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('dialog', options);
  }

  tab(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('tab', options);
  }

  option(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('option', options);
  }

  combobox(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('combobox', options);
  }

  switch(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('switch', options);
  }

  alert(
    options?: Omit<RoleOptions, 'name'> & {
      name?: string | RegExp;
    }
  ): SimplifiedLocator {

    return this.role('alert', options);
  }

  // ============================================================
  // TEXT / ATTRIBUTE BASED LOCATORS
  // ============================================================

  text(
    text: string | RegExp,
    options?: TextOptions
  ): SimplifiedLocator {

    if (this.target === null) {
      return this.wrap(
        this.page.getByText(text, options)
      );
    }

    return this.wrap(
      this.resolveLocator().getByText(text, options)
    );
  }

  label(
    text: string | RegExp,
    options?: LabelOptions
  ): SimplifiedLocator {

    if (this.target === null) {
      return this.wrap(
        this.page.getByLabel(text, options)
      );
    }

    return this.wrap(
      this.resolveLocator().getByLabel(text, options)
    );
  }

  placeholder(
    text: string | RegExp,
    options?: PlaceholderOptions
  ): SimplifiedLocator {

    if (this.target === null) {
      return this.wrap(
        this.page.getByPlaceholder(text, options)
      );
    }

    return this.wrap(
      this.resolveLocator().getByPlaceholder(text, options)
    );
  }

  testId(testId: string): SimplifiedLocator {

    if (this.target === null) {
      return this.wrap(
        this.page.getByTestId(testId)
      );
    }

    return this.wrap(
      this.resolveLocator().getByTestId(testId)
    );
  }

  // ============================================================
  // LOCATOR CHAINING
  // ============================================================

  filter(
    options?: FilterOptions
  ): SimplifiedLocator {

    return this.wrap(
      this.resolveLocator().filter(options)
    );
  }

  nth(index: number): SimplifiedLocator {

    return this.wrap(
      this.resolveLocator().nth(index)
    );
  }

  first(): SimplifiedLocator {

    return this.wrap(
      this.resolveLocator().first()
    );
  }

  last(): SimplifiedLocator {

    return this.wrap(
      this.resolveLocator().last()
    );
  }

  and(other: SimplifiedLocator): SimplifiedLocator {

    return this.wrap(
      this.resolveLocator().and(
        other.resolveLocator()
      )
    );
  }

  or(other: SimplifiedLocator): SimplifiedLocator {

    return this.wrap(
      this.resolveLocator().or(
        other.resolveLocator()
      )
    );
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  async click(): Promise<void> {
    await this.resolveLocator().click();
  }

  async dblclick(): Promise<void> {
    await this.resolveLocator().dblclick();
  }

  async fill(value: string): Promise<void> {
    await this.resolveLocator().fill(value);
  }

  async clear(): Promise<void> {
    await this.resolveLocator().clear();
  }

  async press(key: string): Promise<void> {
    await this.resolveLocator().press(key);
  }

  async pressSequentially(
    text: string,
    options?: Parameters<Locator['pressSequentially']>[1]
  ): Promise<void> {
    await this.resolveLocator().pressSequentially(
      text,
      options
    );
  }

  async hover(): Promise<void> {
    await this.resolveLocator().hover();
  }

  async focus(): Promise<void> {
    await this.resolveLocator().focus();
  }

  async check(): Promise<void> {
    await this.resolveLocator().check();
  }

  async uncheck(): Promise<void> {
    await this.resolveLocator().uncheck();
  }

  async setChecked(checked: boolean): Promise<void> {
    await this.resolveLocator().setChecked(checked);
  }

  async selectOption(
    values: Parameters<Locator['selectOption']>[0],
    options?: Parameters<Locator['selectOption']>[1]
  ): Promise<string[]> {
    return await this.resolveLocator().selectOption(
      values,
      options
    );
  }

  async selectText(): Promise<void> {
    await this.resolveLocator().selectText();
  }

  async tap(): Promise<void> {
    await this.resolveLocator().tap();
  }

  async dragTo(
    target: SimplifiedLocator,
    options?: Parameters<Locator['dragTo']>[1]
  ): Promise<void> {
    await this.resolveLocator().dragTo(
      target.resolveLocator(),
      options
    );
  }

  async scrollIntoViewIfNeeded(): Promise<void> {
    await this.resolveLocator().scrollIntoViewIfNeeded();
  }

  async setInputFiles(
    files: Parameters<Locator['setInputFiles']>[0],
    options?: Parameters<Locator['setInputFiles']>[1]
  ): Promise<void> {
    await this.resolveLocator().setInputFiles(
      files,
      options
    );
  }

  // ============================================================
  // INFORMATION / STATE
  // ============================================================

  async textContent(): Promise<string | null> {
    return await this.resolveLocator().textContent();
  }

  async innerText(): Promise<string> {
    return await this.resolveLocator().innerText();
  }

  async innerHTML(): Promise<string> {
    return await this.resolveLocator().innerHTML();
  }

  async inputValue(): Promise<string> {
    return await this.resolveLocator().inputValue();
  }

  async getAttribute(
    name: string
  ): Promise<string | null> {
    return await this.resolveLocator().getAttribute(name);
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

  async isEditable(): Promise<boolean> {
    return await this.resolveLocator().isEditable();
  }

  async isChecked(): Promise<boolean> {
    return await this.resolveLocator().isChecked();
  }

  async count(): Promise<number> {
    return await this.resolveLocator().count();
  }

  // ============================================================
  // WAITING
  // ============================================================

  async waitFor(
    options?: Parameters<Locator['waitFor']>[0]
  ): Promise<void> {
    await this.resolveLocator().waitFor(options);
  }

  // ============================================================
  // ASSERTIONS
  // ============================================================

  async expectedToBeVisible(): Promise<void> {
    await expect(this.resolveLocator()).toBeVisible();
  }

  async expectedToBeHidden(): Promise<void> {
    await expect(this.resolveLocator()).toBeHidden();
  }

  async expectedToBeEnabled(): Promise<void> {
    await expect(this.resolveLocator()).toBeEnabled();
  }

  async expectedToBeDisabled(): Promise<void> {
    await expect(this.resolveLocator()).toBeDisabled();
  }

  async expectedToBeChecked(): Promise<void> {
    await expect(this.resolveLocator()).toBeChecked();
  }

  async expectTextToBe(
    text: string | RegExp
  ): Promise<void> {
    await expect(this.resolveLocator()).toHaveText(text);
  }

  async expectValueToBe(
    value: string | RegExp
  ): Promise<void> {
    await expect(this.resolveLocator()).toHaveValue(value);
  }

  async expectAttributeToBe(
    name: string,
    value: string | RegExp
  ): Promise<void> {
    await expect(this.resolveLocator()).toHaveAttribute(
      name,
      value
    );
  }

  async expectCountToBe(
    count: number
  ): Promise<void> {
    await expect(this.resolveLocator()).toHaveCount(count);
  }
}