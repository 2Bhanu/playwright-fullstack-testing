
import {
    APIRequestContext,
    test as base,
} from '@playwright/test';

import { type ApiClientFixtures, ApiClientManager } from '@/api/Clients/ApiClientManager';
import { BaseApiClient } from '@/api/Clients/BaseApiClient';





/*
 * Fixtures visible to the test.
 *
 * Automatically derived from:
 *
 *     ApiClientManager.clients
 */
type Fixtures = ApiClientFixtures;


/*
 * Runtime fixture function.
 *
 * This type exists only so TypeScript knows the types of:
 *
 *     request
 *     use
 *
 * We don't need to make the dynamic registry itself
 * excessively clever.
 */
type ApiClientFixture = (
    args: {
        request: APIRequestContext;
    },
    use: (
        client: BaseApiClient
    ) => Promise<void>
) => Promise<void>;


/*
 * Runtime collection of generated fixtures.
 */
const clientFixtures:
    Record<string, ApiClientFixture> = {};


/*
 * ================================================================
 * GENERATE CLIENT FIXTURES
 * ================================================================
 */
for (
    const [fixtureName, ClientClass]
    of Object.entries(ApiClientManager.clients)
) {

    clientFixtures[fixtureName] = async (
        { request },
        use
    ) => {

        /*
         * Manager is framework infrastructure.
         * It is NOT a Playwright fixture.
         */
        const manager =
            new ApiClientManager(request);


        /*
         * Handles:
         *
         *     setup()
         *     construction
         */
        const client =
            await manager.create(ClientClass);


        try {

            /*
             * Give client to the test.
             */
            await use(client);

        } finally {

            /*
             * Handles optional cleanup().
             */
            await manager.cleanup(ClientClass);
        }
    };
}


/*
 * ================================================================
 * PLAYWRIGHT TEST
 * ================================================================
 */
export const test_api =
    base.extend<Fixtures>({
        ...clientFixtures,
    });