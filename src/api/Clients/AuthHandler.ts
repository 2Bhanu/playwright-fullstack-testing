/**
 * Stateless auth specs for the API client layer.
 *
 * Each auth kind is plain data — a discriminated union — that
 * `AuthHandler.apply` projects onto a headers map at request time.
 * Nothing here is constructed per request: tests build the spec
 * once and pass it to `.withAuth(...)`.
 *
 * Usage:
 *
 *     userClient.loginEndPoint
 *         .withAuth(AuthHandler.bearer(token))
 *         .withPayload(myUser)
 *         .post()
 *
 *     userClient.someEndpoint
 *         .withAuth(AuthHandler.basic('u', 'p'))
 *         .get()
 *
 *     userClient.someEndpoint
 *         .withAuth(AuthHandler.apiKey('secret', 'X-API-Key'))
 *         .get()
 */


/*
 * ================================================================
 * AUTH SPEC
 * ================================================================
 *
 * Discriminated union. New auth kinds are added by extending this
 * type and adding a branch to `AuthHandler.apply`.
 */
export type AuthSpec =
    | {
        kind: 'bearer';
        token:
            | string
            | (() => Promise<string>);
    }
    | {
        kind: 'basic';
        username: string;
        password: string;
    }
    | {
        kind: 'apiKey';
        key: string;
        headerName?: string;
    };


/*
 * ================================================================
 * FACTORY + APPLY
 * ================================================================
 *
 * `AuthHandler.bearer/basic/apiKey` produce spec objects. `apply`
 * projects a spec onto a headers bag at call time.
 */
export const AuthHandler = {

    bearer(
        token: string | (() => Promise<string>)
    ): AuthSpec {
        return {
            kind: 'bearer',
            token
        };
    },

    basic(
        username: string,
        password: string
    ): AuthSpec {
        return {
            kind: 'basic',
            username,
            password
        };
    },

    apiKey(
        key: string,
        headerName?: string
    ): AuthSpec {
        return {
            kind: 'apiKey',
            key,
            headerName
        };
    },

    /**
     * Project an auth spec onto a headers bag.
     *
     * Async because the bearer variant may resolve a token provider
     * at request time (token refresh, lazy fetch).
     */
    async apply(
        headers: Record<string, string>,
        auth: AuthSpec
    ): Promise<Record<string, string>> {

        switch (auth.kind) {

        case 'bearer': {
            const token =
                typeof auth.token === 'string'
                    ? auth.token
                    : await auth.token();

            return {
                ...headers,
                Authorization: `Bearer ${token}`
            };
        }

        case 'basic': {
            const encoded =
                Buffer.from(
                    `${auth.username}:${auth.password}`
                ).toString('base64');

            return {
                ...headers,
                Authorization: `Basic ${encoded}`
            };
        }

        case 'apiKey': {
            return {
                ...headers,
                [auth.headerName ?? 'X-API-Key']:
                    auth.key
            };
        }
        }
    }
};
