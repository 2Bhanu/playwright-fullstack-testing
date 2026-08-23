import { expect, test } from '@/framework/fixtures/fixture_aggregator';
import { Env } from '@/config/env';


/*
 * List users — reqres.in /api/users
 *
 * Mirrors the curl:
 *
 *     curl -X GET 'https://reqres.in/api/users' \
 *          -H 'x-api-key: reqres_…'
 *
 * - Base URL flows from `Env.reqresBaseHost` via the client's
 *   default `forURL`. Tests can override with `.forURL(...)` on
 *   the chain when needed.
 * - API key is sourced from `Env.reqresAPIKey`; never hard-coded.
 * - Header name `x-api-key` is passed as the third arg to
 *   `withAuth('apiKey', …)` because the framework's default
 *   api-key header is `X-API-Key`, not `x-api-key`.
 */
test(
    'reqres: GET /api/users with x-api-key returns the users list',
    async ({ reqresUserClient }) => {

        const response =
            await reqresUserClient.listUsersEndPoint
                .withAuth(
                    'apiKey',
                    Env.reqresAPIKey,
                    'x-api-key'
                )
                .get();

        expect(response.status()).toBe(200);

        const body =
            await response.json();

        expect(body).toMatchObject({
            page: expect.any(Number),
            per_page: expect.any(Number),
            total: expect.any(Number),
            total_pages: expect.any(Number),
            data: expect.any(Array),
        });
    }
);
