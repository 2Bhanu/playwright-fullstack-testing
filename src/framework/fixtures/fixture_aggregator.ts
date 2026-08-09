import { mergeTests } from '@playwright/test';

import { test as pageTest } from './pageFixture';
import { test as apiTest } from './api/api-fixture';
import { test as loggingTest } from './log_fixture';

export const test = mergeTests(
  pageTest,
  apiTest,
  loggingTest,
);

export { expect } from '@playwright/test';