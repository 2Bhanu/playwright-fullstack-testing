import { mergeTests } from '@playwright/test';


import { test as apiTest } from './api/api-fixture';
import { test as loggingTest } from './log_fixture';
import { test as pageTest } from './pageFixture';

export const test = mergeTests(
  pageTest,
  apiTest,
  loggingTest,
);

export { expect } from '@playwright/test';