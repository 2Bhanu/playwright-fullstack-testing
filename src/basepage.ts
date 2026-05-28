import {
  Locator,
  Page,
} from '@playwright/test';

export abstract class BasePage {
  /**
   * Universal scope primitive.
   *
   * Entire framework internally operates only on Locator.
   * Page is converted to root locator during bootstrap.
   */
  protected readonly root: Locator;

  protected constructor(pageOrLocator: Page | Locator) {
  if ('url' in pageOrLocator) {
    this.root = pageOrLocator.locator('html');
  } else {
    this.root = pageOrLocator;
  }
}

  /**
   * Child pages recreate themselves
   * with a new scoped root.
   *
   * This preserves child typing across chaining.
   */
  protected abstract clone(root: Locator): this;

  /**
   * Internal helper used by all chain operations.
   */
  protected scoped(locator: Locator): this {
    return this.clone(locator);
  }

  // =====================================================
  // PLAYWRIGHT ESCAPE HATCH
  // =====================================================

  /**
   * Gives direct access to underlying Playwright Locator.
   */
  getElement(): Locator {
    return this.root;
  }

  // =====================================================
  // CORE GENERIC LOCATORS
  // =====================================================

  locator(selector: string): this {
    return this.scoped(
      this.root.locator(selector)
    );
  }

  role(
  role: Parameters<Locator['getByRole']>[0],
  options?: Parameters<Locator['getByRole']>[1]
): this {
  return this.scoped(
    this.root.getByRole(role, options)
  );
}

  text(
    text: string | RegExp,
    options?: Parameters<Locator['getByText']>[1]
  ): this {
    return this.scoped(
      this.root.getByText(text, options)
    );
  }

  label(
    text: string | RegExp,
    options?: Parameters<Locator['getByLabel']>[1]
  ): this {
    return this.scoped(
      this.root.getByLabel(text, options)
    );
  }

  placeholder(
    text: string | RegExp,
    options?: Parameters<Locator['getByPlaceholder']>[1]
  ): this {
    return this.scoped(
      this.root.getByPlaceholder(text, options)
    );
  }

  testId(value: string): this {
    return this.scoped(
      this.root.getByTestId(value)
    );
  }

  // =====================================================
  // ROLE SHORTCUTS
  // =====================================================

  button(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('button', options);
  }

  link(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('link', options);
  }

  textbox(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('textbox', options);
  }

  checkbox(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('checkbox', options);
  }

  radio(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('radio', options);
  }

  combobox(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('combobox', options);
  }

  option(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('option', options);
  }

  heading(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('heading', options);
  }

  dialog(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('dialog', options);
  }

  row(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('row', options);
  }

  cell(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('cell', options);
  }

  list(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('list', options);
  }

  listitem(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('listitem', options);
  }

  img(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('img', options);
  }

  tab(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('tab', options);
  }

  tabpanel(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('tabpanel', options);
  }

  menuitem(
    options?: Parameters<Locator['getByRole']>[1]
  ): this {
    return this.role('menuitem', options);
  }

  // =====================================================
  // LOCATOR MODIFIERS
  // =====================================================

  first(): this {
    return this.scoped(
      this.root.first()
    );
  }

  last(): this {
    return this.scoped(
      this.root.last()
    );
  }

  nth(index: number): this {
    return this.scoped(
      this.root.nth(index)
    );
  }

  filter(
    options: Parameters<Locator['filter']>[0]
  ): this {
    return this.scoped(
      this.root.filter(options)
    );
  }

  and(locator: Locator): this {
    return this.scoped(
      this.root.and(locator)
    );
  }

  or(locator: Locator): this {
    return this.scoped(
      this.root.or(locator)
    );
  }

  locatorHas(locator: Locator): this {
    return this.filter({ has: locator });
  }

  locatorHasText(text: string | RegExp): this {
    return this.filter({ hasText: text });
  }

  // =====================================================
  // COMMON ACTIONS
  // =====================================================

  async click(): Promise<void> {
    await this.root.click();
  }

  async fill(value: string): Promise<void> {
    await this.root.fill(value);
  }

  async type(value: string): Promise<void> {
    await this.root.type(value);
  }

  async press(key: string): Promise<void> {
    await this.root.press(key);
  }

  async hover(): Promise<void> {
    await this.root.hover();
  }

  async focus(): Promise<void> {
    await this.root.focus();
  }

  async check(): Promise<void> {
    await this.root.check();
  }

  async uncheck(): Promise<void> {
    await this.root.uncheck();
  }

  async selectOption(
    value: string | string[]
  ): Promise<void> {
    await this.root.selectOption(value);
  }

  // =====================================================
  // COMMON STATE / VALUES
  // =====================================================

  async innerText(): Promise<string> {
    return this.root.innerText();
  }

  async textContent(): Promise<string | null> {
    return this.root.textContent();
  }

  async inputValue(): Promise<string> {
    return this.root.inputValue();
  }

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  async isHidden(): Promise<boolean> {
    return this.root.isHidden();
  }

  async isEnabled(): Promise<boolean> {
    return this.root.isEnabled();
  }

  async isDisabled(): Promise<boolean> {
    return this.root.isDisabled();
  }

  async count(): Promise<number> {
    return this.root.count();
  }

  async exists(): Promise<boolean> {
    return (await this.count()) > 0;
  }

  // =====================================================
  // WAIT HELPERS
  // =====================================================

  async waitForVisible(
    timeout?: number
  ): Promise<void> {
    await this.root.waitFor({
      state: 'visible',
      timeout,
    });
  }

  async waitForHidden(
    timeout?: number
  ): Promise<void> {
    await this.root.waitFor({
      state: 'hidden',
      timeout,
    });
  }

  async scrollIntoViewIfNeeded(): Promise<void> {
    await this.root.scrollIntoViewIfNeeded();
  }
}