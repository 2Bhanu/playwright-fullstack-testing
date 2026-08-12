import { test as base } from '@playwright/test';

import { testLogContext } from '../logging/test_logging_context';



type TestFixtures = {
  testLogging: void;
};
export const test_log = base.extend<TestFixtures >({

  testLogging: [
    async ({}, use, testInfo) => {

      const context = {
        logs: [],
      };

      await testLogContext.run(
        context,
        async () => {
          await use();
        },
      );

      if (context.logs.length > 0) {
        await testInfo.attach('execution-log', {
          body: context.logs.join('\n'),
          contentType: 'text/plain',
        });
      }
    },

    { auto: true },
  ],

});

export { expect } from '@playwright/test';