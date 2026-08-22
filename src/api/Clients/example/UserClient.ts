import type { APIRequestContext } from '@playwright/test';

import { BaseApiClient } from '../BaseApiClient';
import { SimplifiedRequest } from '../SimplifiedRequest';


export class UserClient extends BaseApiClient {

    /*
     * ============================================================
     * ENDPOINTS
     * ============================================================
     *
     * Each endpoint is a `SimplifiedRequest` bound to a base path.
     * Tests chain off the endpoint:
     *
     *     const token = await authClient.getBearerToken();
     *     userClient.loginEndPoint
     *         .withAuth('bearer', { kind: 'bearer', token })
     *         .withPayload(myUser)
     *         .post()
     */
    readonly loginEndPoint =
        new SimplifiedRequest(
            this.request,
            '/login'
        );

    readonly updateEndPoint =
        new SimplifiedRequest(
            this.request,
            '/users'
        );

    readonly getUserEndPoint =
        new SimplifiedRequest(
            this.request,
            '/users'
        );


    /*
     * ============================================================
     * SETUP / CLEANUP
     * ============================================================
     *
     * Called by ApiClientManager before/after each test that uses
     * this client. Use them to seed or tear down tenant data.
     */
    static async setup(
        request: APIRequestContext
    ) {
        console.log('UserClient setup');

        // Example:
        // create test tenant
        // authenticate
        // seed required data
    }

    static async cleanup(
        request: APIRequestContext
    ) {
        console.log('UserClient cleanup');

        // Example:
        // delete test data
        // remove tenant
    }
}
