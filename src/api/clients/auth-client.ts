import { BaseApiClient } from './base-api-client';
import { SimplifiedRequest } from './simplified-request';


/**
 * Auth client — sibling of UserClient / AdminClient.
 *
 * Owns the endpoints that resolve credentials (bearer token, basic
 * auth, api key). Tests destructure this client from the fixture bag
 * and call its getter methods to obtain credentials, then pass the
 * result to `.withAuth(...)` on a `SimplifiedRequest` chain:
 *
 *     test('...', async ({ authClient, userClient }) => {
 *         const token = await authClient.getBearerToken();
 *         await userClient.loginEndPoint
 *             .withAuth('bearer', token)
 *             .withPayload(myUser)
 *             .post();
 *     });
 *
 * The getter methods are currently STUBS — they return hard-coded
 * placeholders so the request fires and produces an obvious 401,
 * which is the visible signal that real auth has not been wired yet.
 * When real auth endpoints are available, the stubs are replaced with
 * calls to the corresponding `*EndPoint` fields declared below.
 */
export class AuthClient extends BaseApiClient {

    /*
     * ============================================================
     * ENDPOINTS
     * ============================================================
     *
     * Each endpoint is a `SimplifiedRequest` bound to a base path.
     * Declared now so the wiring is complete when the stubs are
     * replaced with real implementations.
     */
    readonly getBearerTokenEndPoint =
        new SimplifiedRequest(
            this.request,
            '/auth/token'
        );

    readonly getBasicAuthEndPoint =
        new SimplifiedRequest(
            this.request,
            '/auth/basic'
        );

    readonly getApiKeyEndPoint =
        new SimplifiedRequest(
            this.request,
            '/auth/api-key'
        );


    /*
     * ============================================================
     * STUB GETTERS
     * ============================================================
     *
     * Hard-coded placeholders. Replace each with a call to the
     * matching endpoint above once the auth backend is available.
     */

    /** Stub: returns a hard-coded placeholder bearer token. */
    async getBearerToken(): Promise<string> {
        return 'PLACEHOLDER_BEARER_TOKEN';
    }

    /** Stub: returns a hard-coded placeholder basic-auth credential pair. */
    async getBasicAuth(): Promise<{
        username: string;
        password: string;
    }> {
        return {
            username: 'PLACEHOLDER_USERNAME',
            password: 'PLACEHOLDER_PASSWORD',
        };
    }

    /** Stub: returns a hard-coded placeholder api-key credential pair. */
    async getApiKey(): Promise<{
        key: string;
        headerName?: string;
    }> {
        return {
            key: 'PLACEHOLDER_API_KEY',
            headerName: 'X-API-Key',
        };
    }
}
