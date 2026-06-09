import { test as base, expect } from '@playwright/test';
import CommonComponentsPage from '../pages/components/commonComponentsPage';



type Fixtures = {
  commonComponentsPage: CommonComponentsPage;
};

export const test = base.extend<Fixtures>({
  commonComponentsPage: async ({ page }, use) => {
    await use(new CommonComponentsPage(page));
  },
});

export { expect };