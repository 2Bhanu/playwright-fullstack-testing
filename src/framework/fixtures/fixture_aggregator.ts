import { mergeTests } from '@playwright/test';


import { test_api as apiTest } from './api/api-fixture';
import { test_log as loggingTest } from './log_fixture';
import { test_page as pageTest } from './page-fixture';

import { test_db as dbTest } from '@/framework/fixtures/db-fixture';

export const test = mergeTests(
  pageTest,
  apiTest,
  loggingTest,
  dbTest,
);

export { expect } from '@playwright/test';
