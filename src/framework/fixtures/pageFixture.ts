import {
    Page,
    test as base,
} from '@playwright/test';

import { BasePage } from '@/ui/pages/base/basepage';
import { type PageFixtures, PageManager } from '@/ui/pages/PageManager';



/*
 * Fixtures visible to the test.
 *
 * Automatically derived from:
 *
 *     PageManager.clients
 */
type Fixtures = PageFixtures;


/*
 * Runtime fixture function.
 *
 * This type exists only so TypeScript knows the types of:
 *
 *     page
 *     use
 *
 * We don't need to make the dynamic registry itself
 * excessively clever.
 */
type PageFixture = (
    args: {
        page: Page;
    },
    use: (
        page: BasePage
    ) => Promise<void>
) => Promise<void>;


/*
 * Runtime collection of generated fixtures.
 */
const pageFixtures:
    Record<string, PageFixture> = {};


/*
 * ================================================================
 * GENERATE PAGE FIXTURES
 * ================================================================
 */
for (
    const [fixtureName, PageClass]
    of Object.entries(PageManager.clients)
) {

    pageFixtures[fixtureName] = async (
        { page },
        use
    ) => {

        /*
         * Manager is framework infrastructure.
         * It is NOT a Playwright fixture.
         */
        const manager =
            new PageManager(page);


        /*
         * Handles:
         *
         *     setup()
         *     construction
         */
        const pageInstance =
            await manager.create(PageClass);


        try {

            /*
             * Give page to the test.
             */
            await use(pageInstance);

        } finally {

            /*
             * Handles optional cleanup().
             */
            await manager.cleanup(PageClass);
        }
    };
}


/*
 * ================================================================
 * PLAYWRIGHT TEST
 * ================================================================
 */
export const test_page =
    base.extend<Fixtures>({
        ...pageFixtures,
    });
