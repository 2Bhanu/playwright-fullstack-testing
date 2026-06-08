import { test as base, expect } from '@playwright/test';



type Fixtures = {
  usersPage: UsersPage;
};

export const test = base.extend<Fixtures>({
  usersPage: async ({ page }, use) => {
    await use(new UsersPage(page));
  },
});

export { expect };