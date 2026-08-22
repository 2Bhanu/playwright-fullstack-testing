import type { Page } from '@playwright/test';

import { BasePage } from './base/basepage';

import CommonComponentsPage from './components/commonComponentsPage';
import { AutomationPracticePage } from './example_pages/automationPracticePage';

/*
 * Describes a PAGE CLASS.
 *
 * The constructor is deliberately public in this type because
 * PageManager is the component responsible for constructing
 * pages.
 *
 * If BasePage has a protected constructor, the actual page
 * classes can still be instantiated by the manager.
 */
export type PageClass<
    T extends BasePage = BasePage
> =
    (new (
        page: Page
    ) => T)
    & {
        setup?: (
            page: Page
        ) => Promise<void>;

        cleanup?: (
            page: Page
        ) => Promise<void>;
    };


/*
 * Extract the INSTANCE type from a class without requiring
 * the constructor itself to be public.
 *
 * For example:
 *
 *     PageInstance<typeof CommonComponentsPage>
 *
 * becomes:
 *
 *     CommonComponentsPage
 */
type PageInstance<T> =
    T extends { prototype: infer I }
        ? I
        : never;


export class PageManager {

    /*
     * ============================================================
     * PAGE REGISTRY
     * ============================================================
     *
     * The key becomes the fixture name.
     *
     * The value is the page CLASS.
     */
    static readonly clients = {
        commonComponentsPage: CommonComponentsPage,
        automationPracticePage: AutomationPracticePage,
    } as const;


    constructor(
        private readonly page: Page
    ) {}


    /*
     * ============================================================
     * CREATE
     * ============================================================
     */
    async create<T extends PageClass>(
        PageClass: T
    ): Promise<PageInstance<T>> {

        const setup = PageClass.setup;

        if (setup) {
            await setup(this.page);
        }

        return new PageClass(
            this.page
        ) as PageInstance<T>;
    }


    /*
     * ============================================================
     * CLEANUP
     * ============================================================
     */
    async cleanup<T extends PageClass>(
        PageClass: T
    ): Promise<void> {

        const cleanup = PageClass.cleanup;

        if (cleanup) {
            await cleanup(this.page);
        }
    }
}


/*
 * ================================================================
 * PLAYWRIGHT PAGE FIXTURES
 * ================================================================
 *
 * Converts:
 *
 *     {
 *         commonComponentsPage: typeof CommonComponentsPage
 *     }
 *
 * into:
 *
 *     {
 *         commonComponentsPage: CommonComponentsPage
 *     }
 */
export type PageFixtures = {
    [K in keyof typeof PageManager.clients]:
        PageInstance<
            typeof PageManager.clients[K]
        >;
};
