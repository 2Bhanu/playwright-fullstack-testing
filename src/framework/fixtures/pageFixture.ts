import CommonComponentsPage from '@/ui/pages/components/commonComponentsPage';
import { test as base, expect } from '@playwright/test';



type Fixtures = {
  commonComponentsPage: CommonComponentsPage;
};

export const test_page = base.extend<Fixtures>({
  commonComponentsPage: async ({ page }, use) => {
    await use(new CommonComponentsPage(page));
  }
});

