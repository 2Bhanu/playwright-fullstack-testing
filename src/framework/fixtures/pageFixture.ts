import { test as base, expect } from '@playwright/test';

import CommonComponentsPage from '../pages/components/commonComponentsPage';
import { LoginPage } from '../pages/pages/loginpage';



type Fixtures = {
  commonComponentsPage: CommonComponentsPage;
  loginPage: LoginPage;
};

export const test_page = base.extend<Fixtures>({
  commonComponentsPage: async ({ page }, use) => {
    await use(new CommonComponentsPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  }
});

